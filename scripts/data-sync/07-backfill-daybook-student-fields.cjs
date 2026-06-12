#!/usr/bin/env node
/**
 * Backfill daybookentries with student info fields that were dropped
 * during initial migration. Affects ALL 3 tenants.
 *
 * Missing fields on dev (caused by mapper bug — see Pitfall #11):
 *   - rollNo
 *   - StudentName
 *   - reciptNumber
 *   - studentInfo
 *   - naretion (typo'd alias of narration that frontend reads)
 *
 * The legacyGateway /dayBook/data endpoint reads these directly from the
 * dev doc and returns empty strings when missing → frontend daybook viewer
 * shows blank rollNo/StudentName/receipt columns.
 *
 * This script pulls fresh prod data via SSH+mongoexport and patches the
 * 5 fields onto each matching dev doc by _legacyId. Idempotent.
 *
 * Usage:
 *   APPLY=true node scripts/data-sync/07-backfill-daybook-student-fields.cjs
 *   (dry-run by default)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { execSync } = require('child_process');

const APPLY = process.env.APPLY === 'true';
const VPS_PASSWORD = process.env.PROD_VPS_PASSWORD || 'zQ>iaRo';
const VPS_HOST = process.env.PROD_VPS_HOST || 'root@66.116.207.89';
const DUMP_DIR = '/tmp';

const TENANTS = [
  { tenant: 'ims_reliance', sourceUri: 'mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore' },
  { tenant: 'chanakya',     sourceUri: 'mongodb://chanakyaapp:chanakya12345@127.0.0.1:27017/Chanakya?authSource=Chanakya' },
  { tenant: 'webliquid',    sourceUri: 'mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27017/webliquidStudio?authSource=admin' },
];

const oid = v => v?.$oid || v?.toString?.() || v;
const log = (msg, ...args) => console.log(`[${new Date().toISOString()}] ${msg}`, ...args);

function pullProdDaybook(tenant, sourceUri) {
  const out = `${DUMP_DIR}/${tenant}_daybookdatas_fresh.json`;
  execSync(
    `SSHPASS='${VPS_PASSWORD}' sshpass -e ssh -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa ${VPS_HOST} "mongoexport --quiet --uri='${sourceUri}' --collection=daybookdatas --jsonArray > /tmp/${tenant}_daybookdatas_fresh.json"`,
    { stdio: 'pipe' }
  );
  execSync(
    `SSHPASS='${VPS_PASSWORD}' sshpass -e scp -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa "${VPS_HOST}:/tmp/${tenant}_daybookdatas_fresh.json" ${out}`,
    { stdio: 'pipe' }
  );
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

async function backfillTenant(db, tenant, sourceUri) {
  log(`──── ${tenant} ────`);
  const prod = pullProdDaybook(tenant, sourceUri);
  const prodById = new Map(prod.map(p => [oid(p._id), p]));
  log(`  prod docs: ${prod.length}`);

  const dev = await db.collection('daybookentries')
    .find({ tenantId: tenant, _legacyId: { $exists: true } })
    .toArray();
  log(`  dev docs: ${dev.length}`);

  let needsUpdate = 0, updated = 0, missingProd = 0;
  for (const d of dev) {
    const p = prodById.get(d._legacyId);
    if (!p) { missingProd++; continue; }

    const set = {};
    if (!d.rollNo && p.rollNo) set.rollNo = String(p.rollNo);
    if (!d.StudentName && p.StudentName) set.StudentName = p.StudentName;
    if (!d.reciptNumber && p.reciptNumber) set.reciptNumber = String(p.reciptNumber);
    if (!d.studentInfo && p.studentInfo) set.studentInfo = oid(p.studentInfo);
    if (!d.naretion && p.naretion) set.naretion = p.naretion;

    if (Object.keys(set).length === 0) continue;
    needsUpdate++;
    if (!APPLY) continue;

    const r = await db.collection('daybookentries').updateOne({ _id: d._id }, { $set: set });
    if (r.modifiedCount === 1) updated++;
  }
  log(`  needs update: ${needsUpdate}  |  ${APPLY ? 'updated' : 'would update'}: ${APPLY ? updated : needsUpdate}  |  orphans (no prod match): ${missingProd}`);
  return { tenant, prodCount: prod.length, devCount: dev.length, needsUpdate, updated: APPLY ? updated : needsUpdate };
}

async function run() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Backfill daybook student fields  mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log('═══════════════════════════════════════════════════════');

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const results = [];
  try {
    for (const { tenant, sourceUri } of TENANTS) {
      try { results.push(await backfillTenant(db, tenant, sourceUri)); }
      catch (e) { console.error(`FAILED tenant=${tenant}:`, e.message); }
    }
  } finally { await mongoose.disconnect(); }

  console.log('\n═══ SUMMARY ═══');
  results.forEach(r => console.log(`  ${r.tenant}: prod=${r.prodCount} dev=${r.devCount} ${APPLY ? 'updated' : 'would update'}=${r.updated}`));
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
