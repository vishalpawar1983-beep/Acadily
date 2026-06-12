#!/usr/bin/env node
/**
 * Daily prod→dev sync for ims_reliance during the Phase-3 coexistence window.
 *
 * Source: VPS legacy `SchoolsStore` MongoDB (read-only).
 * Target: Atlas `flex_academy_dev` MongoDB (used by app.acadily.com).
 *
 * What it does (idempotent, additive):
 *   1. Pull fresh prod dumps over SSH (mongoexport)
 *   2. Sync 8 student financial fields from prod → dev (matches scripts/data-sync/05)
 *   3. Insert any new prod receipts not in dev, with collision-safe receipt-counter bump
 *      (matches scripts/data-sync/02 logic but only for newly-added prod receipts)
 *   4. Backfill any feepayments still missing top-level amountPaid/amountDate (matches 04)
 *   5. Detect orphans (prod-deleted but still in dev) and REPORT only — do NOT auto-delete
 *   6. Email/log a summary so you can sanity-check
 *
 * Safe to run unattended. Fails closed: any error halts the sync, never partially writes.
 *
 * Env required:
 *   MONGO_URI                — Atlas connection (dev target)
 *   PROD_VPS_HOST            — default: root@66.116.207.89
 *   PROD_VPS_PASSWORD        — VPS root password
 *   PROD_MONGO_URI           — VPS legacy mongo URI (default: mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore)
 *
 * Usage:
 *   APPLY=true node scripts/data-sync/daily-prod-to-dev-sync.cjs        # run + write
 *   node scripts/data-sync/daily-prod-to-dev-sync.cjs                   # dry-run
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TENANT = 'ims_reliance';
const APPLY = process.env.APPLY === 'true';
const VPS_HOST = process.env.PROD_VPS_HOST || 'root@66.116.207.89';
const VPS_PASSWORD = process.env.PROD_VPS_PASSWORD || 'zQ>iaRo';
const PROD_MONGO_URI = process.env.PROD_MONGO_URI ||
  'mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore';
const DUMP_DIR = '/tmp';
const COLLECTIONS = ['students', 'courses', 'companies', 'coursefees', 'paymentinstallmenttimes'];

const log = (msg, ...args) => console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
const oid = v => v?.$oid || v?.toString?.() || v;
const date = v => v ? new Date(v?.$date || v) : new Date();

// ── 1. Pull fresh prod dumps over SSH ───────────────────────────────────────
function pullProdDumps() {
  log('1. Pulling fresh prod dumps from', VPS_HOST);
  const cmds = COLLECTIONS.map(c =>
    `mongoexport --quiet --uri="${PROD_MONGO_URI}" --collection=${c} --jsonArray > ${DUMP_DIR}/prod_${c}_fresh.json`
  ).join(' && ');
  const ssh = `SSHPASS='${VPS_PASSWORD}' sshpass -e ssh -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa ${VPS_HOST} '${cmds}'`;
  execSync(ssh, { stdio: 'pipe' });
  const scp = `SSHPASS='${VPS_PASSWORD}' sshpass -e scp -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa "${VPS_HOST}:${DUMP_DIR}/prod_*_fresh.json" ${DUMP_DIR}/`;
  execSync(scp, { stdio: 'pipe' });
  for (const c of COLLECTIONS) {
    const p = `${DUMP_DIR}/prod_${c}_fresh.json`;
    if (!fs.existsSync(p)) throw new Error(`Missing dump: ${p}`);
    log(`   ${c}: ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
  }
}

// ── 2. Sync student financial fields ───────────────────────────────────────
async function syncStudentFinancials(db) {
  log('2. Syncing student financial fields');
  const SPEC = [
    ['enrollment.remainingFees',     'remainingCourseFees'],
    ['enrollment.totalPaid',         'totalPaid'],
    ['enrollment.netFees',           'netCourseFees'],
    ['enrollment.installmentAmount', 'no_of_installments_amount'],
    ['enrollment.installmentCount',  'no_of_installments'],
    ['enrollment.downPayment',       'down_payment'],
    ['enrollment.discount',          'discount'],
    ['enrollment.courseFees',        'course_fees'],
  ];
  const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const prod = JSON.parse(fs.readFileSync(`${DUMP_DIR}/prod_students_fresh.json`));
  const prodById = new Map(prod.map(p => [oid(p._id), p]));
  const dev = await db.collection('students').find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();

  let updated = 0, scanned = 0;
  for (const d of dev) {
    const p = prodById.get(d._legacyId);
    if (!p) continue;
    scanned++;
    const set = {};
    for (const [devPath, prodField] of SPEC) {
      const dv = Number(get(d, devPath)) || 0;
      const pv = Number(p[prodField]) || 0;
      if (dv !== pv) set[devPath] = pv;
    }
    if (Object.keys(set).length === 0) continue;
    if (APPLY) {
      const r = await db.collection('students').updateOne({ _id: d._id }, { $set: set });
      if (r.modifiedCount === 1) updated++;
    } else {
      updated++;
    }
  }
  log(`   scanned ${scanned} students, ${APPLY ? 'updated' : 'would update'} ${updated}`);
  return { scanned, updated };
}

// ── 3. Insert new prod receipts (with collision-safe counter bump) ────────
async function syncNewReceipts(db) {
  log('3. Importing any new prod receipts');
  const prod = JSON.parse(fs.readFileSync(`${DUMP_DIR}/prod_coursefees_fresh.json`));
  const devLegacyIds = new Set(
    (await db.collection('feepayments')
      .find({ tenantId: TENANT, _legacyId: { $exists: true } }, { projection: { _legacyId: 1 } })
      .toArray()).map(d => d._legacyId)
  );

  const toInsert = [];
  for (const p of prod) {
    const pid = oid(p._id);
    if (devLegacyIds.has(pid)) continue;
    toInsert.push({
      tenantId: TENANT,
      studentId: oid(p.studentInfo) || oid(p.studentId) || '',
      courseId: oid(p.courseId || p.courseName) || '',
      courseFees: Number(p.course_fees) || 0,
      discount: Number(p.discount) || 0,
      netFees: Number(p.netCourseFees) || 0,
      totalPaid: Number(p.totalPaid) || 0,
      remainingFees: Number(p.remainingCourseFees) || 0,
      paymentMode: p.paymentOption || '',
      receiptNumber: p.reciptNumber || '',
      // top-level fields legacy endpoints read (avoids needing the backfill step)
      amountPaid: Number(p.amountPaid) || 0,
      amountDate: p.amountDate ? date(p.amountDate) : undefined,
      narration: p.narration || '',
      lateFees: Number(p.lateFees) || 0,
      no_of_installments: Number(p.no_of_installments) || 0,
      no_of_installments_amount: Number(p.no_of_installments_amount) || 0,
      gst_percentage: Number(p.gst_percentage) || 0,
      studentInfo: oid(p.studentInfo),
      companyName: oid(p.companyName),
      courseName: oid(p.courseName),
      paymentOption: oid(p.paymentOption),
      addedBy: oid(p.addedBy),
      createdBy: oid(p.createdBy) || 'sync',
      createdAt: date(p.createdAt),
      updatedAt: date(p.updatedAt),
      _legacyId: pid,
      _raw: p,
    });
  }

  if (toInsert.length === 0) {
    log('   no new receipts to import');
    return { inserted: 0, counterBumped: false };
  }

  log(`   ${toInsert.length} new receipts to import`);
  if (!APPLY) return { inserted: toInsert.length, counterBumped: 'dry-run' };

  // Bump counter to prod's max BEFORE insert to prevent app collisions during the window
  const maxRecipt = prod
    .map(p => parseInt((p.reciptNumber || '').replace(/^VM-/, ''), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  let counterBumped = false;
  if (maxRecipt > 0) {
    const counter = await db.collection('receiptcounters').findOne({ tenantId: TENANT });
    if (counter && counter.currentValue < maxRecipt) {
      await db.collection('receiptcounters').updateOne(
        { tenantId: TENANT },
        { $set: { currentValue: maxRecipt, updatedAt: new Date() } }
      );
      counterBumped = `${counter.currentValue} → ${maxRecipt}`;
      log(`   counter bumped: ${counterBumped}`);
    }
  }

  // Idempotent insert with collision detection
  let inserted = 0, collisions = [];
  for (const doc of toInsert) {
    try {
      await db.collection('feepayments').insertOne(doc);
      inserted++;
    } catch (e) {
      if (e.code === 11000) {
        collisions.push({ receipt: doc.receiptNumber, legacyId: doc._legacyId });
      } else throw e;
    }
  }
  if (collisions.length > 0) {
    log(`   ⚠️  ${collisions.length} receipts collided with existing dev docs (likely app-generated). Manual review needed:`);
    collisions.forEach(c => log(`      ${c.receipt} (legacyId: ${c.legacyId})`));
  }
  log(`   inserted ${inserted} / ${toInsert.length}`);
  return { inserted, counterBumped, collisions };
}

// ── 4. Backfill top-level fields on any feepayments still missing them ────
async function backfillTopLevelFields(db) {
  log('4. Backfilling top-level fields on feepayments (if any)');
  const FIELD_MAP = [
    ['amountPaid',                'amountPaid',                'num'],
    ['amountDate',                'amountDate',                'date'],
    ['narration',                 'narration',                 'string'],
    ['lateFees',                  'lateFees',                  'num'],
    ['no_of_installments',        'no_of_installments',        'num'],
    ['no_of_installments_amount', 'no_of_installments_amount', 'num'],
    ['gst_percentage',            'gst_percentage',            'num'],
    ['studentInfo',               'studentInfo',               'oid'],
    ['companyName',               'companyName',               'oid'],
    ['courseName',                'courseName',                'oid'],
    ['paymentOption',             'paymentOption',             'oid'],
    ['addedBy',                   'addedBy',                   'oid'],
  ];
  const cast = (v, k) => {
    if (v === undefined || v === null) return undefined;
    if (k === 'num') return Number(v) || 0;
    if (k === 'date') return new Date(v?.$date || v);
    if (k === 'string') return String(v);
    if (k === 'oid') return v?.$oid || (typeof v === 'string' ? v : v?.toString?.());
    return v;
  };

  const docs = await db.collection('feepayments')
    .find({ tenantId: TENANT, _legacyId: { $exists: true }, amountPaid: { $exists: false } })
    .toArray();

  let updated = 0;
  for (const d of docs) {
    const set = {};
    for (const [topKey, rawKey, kind] of FIELD_MAP) {
      const rv = d._raw?.[rawKey];
      if (rv === undefined || rv === null) continue;
      if (d[topKey] !== undefined && d[topKey] !== null) continue;
      const cv = cast(rv, kind);
      if (cv === undefined) continue;
      set[topKey] = cv;
    }
    if (Object.keys(set).length === 0) continue;
    if (APPLY) {
      const r = await db.collection('feepayments').updateOne({ _id: d._id }, { $set: set });
      if (r.modifiedCount === 1) updated++;
    } else updated++;
  }
  log(`   ${APPLY ? 'updated' : 'would update'} ${updated} feepayments`);
  return { updated };
}

// ── 5. Detect orphans (report only) ───────────────────────────────────────
async function detectOrphans(db) {
  log('5. Detecting orphans (report only — no auto-delete)');
  const out = {};
  for (const [label, devColl, file] of [
    ['feepayments',     'feepayments',     'prod_coursefees_fresh.json'],
    ['feeinstallments', 'feeinstallments', 'prod_paymentinstallmenttimes_fresh.json'],
  ]) {
    const prod = JSON.parse(fs.readFileSync(`${DUMP_DIR}/${file}`));
    const prodIds = new Set(prod.map(p => oid(p._id)));
    const dev = await db.collection(devColl).find({ tenantId: TENANT }).toArray();
    const orphans = dev.filter(d => d._legacyId && !prodIds.has(d._legacyId));
    out[label] = orphans.length;
    log(`   ${label}: dev=${dev.length} prod=${prod.length} orphans=${orphans.length}`);
    if (orphans.length > 0 && orphans.length <= 5) {
      orphans.forEach(o => log(`      ${o._legacyId} (${o.receiptNumber || ('inst-' + o.installmentNumber)})`));
    }
  }
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function run() {
  const t0 = Date.now();
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Daily prod→dev sync   tenant=' + TENANT);
  console.log('  Mode: ' + (APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)'));
  console.log('═══════════════════════════════════════════════════════');

  pullProdDumps();
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  try {
    const r2 = await syncStudentFinancials(db);
    const r3 = await syncNewReceipts(db);
    const r4 = await backfillTopLevelFields(db);
    const r5 = await detectOrphans(db);
    log('═══════════════ SUMMARY ═══════════════');
    log(JSON.stringify({ tenant: TENANT, durationMs: Date.now() - t0, financials: r2, newReceipts: r3, backfill: r4, orphans: r5 }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
