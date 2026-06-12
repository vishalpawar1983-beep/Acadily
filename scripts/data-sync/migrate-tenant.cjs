#!/usr/bin/env node
/**
 * Parameterized tenant migration: VPS legacy MongoDB → dev Atlas (flex_academy_dev)
 *
 * Idempotent, additive, dry-run by default. Re-runnable safely.
 *
 * Use cases:
 *   1. Initial migration of a new tenant
 *   2. Topping up an already-partially-migrated tenant with new prod docs
 *   3. Syncing financial drift on already-migrated student docs
 *
 * Configuration via env:
 *   TENANT_ID        — required (e.g. webliquid, chanakya)
 *   SOURCE_MONGO_URI — required (VPS legacy db connection)
 *   COMPANY_ID       — optional, the company doc id in Atlas (auto-derived if exists)
 *   APPLY            — true to write, default dry-run
 *
 * Run from local machine. Script SSHes to VPS to run mongoexport (read-only on prod),
 * pulls dumps via scp, then connects directly to Atlas.
 *
 * Sources are read-only — script never writes to VPS.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { execSync } = require('child_process');
const { ObjectId } = require('mongodb');

const TENANT = process.env.TENANT_ID;
const SOURCE_URI = process.env.SOURCE_MONGO_URI;
const APPLY = process.env.APPLY === 'true';
const VPS_HOST = process.env.PROD_VPS_HOST || 'root@66.116.207.89';
const VPS_PASSWORD = process.env.PROD_VPS_PASSWORD || 'zQ>iaRo';
const DUMP_DIR = '/tmp';

if (!TENANT) { console.error('ABORT: TENANT_ID required'); process.exit(2); }
if (!SOURCE_URI) { console.error('ABORT: SOURCE_MONGO_URI required'); process.exit(2); }

const COLLECTIONS = ['students', 'courses', 'companies', 'coursefees',
  'paymentinstallmenttimes', 'daybookaccounts', 'daybookdatas'];

const log = (msg, ...args) => console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
const oid = v => v?.$oid || v?.toString?.() || v;
const date = v => v ? new Date(v?.$date || v) : new Date();

// ── Pull fresh dumps from VPS ──────────────────────────────────────────────
function pullDumps() {
  log(`1. Exporting prod collections from ${VPS_HOST} for tenant=${TENANT}`);
  const cmds = COLLECTIONS.map(c =>
    `mongoexport --quiet --uri='${SOURCE_URI}' --collection=${c} --jsonArray > ${DUMP_DIR}/${TENANT}_${c}_fresh.json 2>/dev/null || echo '[]' > ${DUMP_DIR}/${TENANT}_${c}_fresh.json`
  ).join(' && ');
  execSync(`SSHPASS='${VPS_PASSWORD}' sshpass -e ssh -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa ${VPS_HOST} "${cmds}"`, { stdio: 'pipe' });
  execSync(`SSHPASS='${VPS_PASSWORD}' sshpass -e scp -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa "${VPS_HOST}:${DUMP_DIR}/${TENANT}_*_fresh.json" ${DUMP_DIR}/`, { stdio: 'pipe' });
  for (const c of COLLECTIONS) {
    const p = `${DUMP_DIR}/${TENANT}_${c}_fresh.json`;
    const sz = fs.existsSync(p) ? fs.statSync(p).size : 0;
    const count = sz > 2 ? JSON.parse(fs.readFileSync(p)).length : 0;
    log(`   ${c}: ${count} docs (${(sz / 1024).toFixed(1)} KB)`);
  }
}
function load(c) { return JSON.parse(fs.readFileSync(`${DUMP_DIR}/${TENANT}_${c}_fresh.json`, 'utf8')); }

// ── Mappers (legacy snake_case → DDD camelCase) ────────────────────────────
function mapStudent(s, courseLegacyToDevId) {
  const courseLegacyId = oid(s.courseName);
  const [first, ...rest] = (s.name || '').trim().split(/\s+/);
  return {
    tenantId: TENANT,
    rollNumber: String(s.rollNumber || ''),
    firstName: first || '',
    lastName: rest.join(' '),
    fatherName: s.father_name || '',
    contact: {
      mobile: s.mobile_number || '',
      phone: s.phone_number || '',
      email: s.email || '',
      address: s.present_address || '',
      city: s.city || '',
    },
    dateOfBirth: s.date_of_birth ? date(s.date_of_birth) : null,
    educationQualification: s.education_qualification || '',
    enrollment: {
      courseId: courseLegacyToDevId.get(courseLegacyId) || courseLegacyId,
      courseName: s.select_course || '',
      courseFees: Number(s.course_fees) || 0,
      discount: Number(s.discount) || 0,
      netFees: Number(s.netCourseFees) || 0,
      remainingFees: Number(s.remainingCourseFees) || 0,
      totalPaid: Number(s.totalPaid) || 0,
      downPayment: Number(s.down_payment) || 0,
      dateOfJoining: s.date_of_joining ? date(s.date_of_joining) : date(s.createdAt),
      installmentCount: Number(s.no_of_installments) || 0,
      installmentAmount: Number(s.no_of_installments_amount) || 0,
      companyId: oid(s.companyName) || '',
    },
    companyName: oid(s.companyName) || '',
    status: s.dropOutStudent ? 'dropout' : 'active',
    image: s.image || '',
    notes: null,
    createdAt: date(s.createdAt),
    updatedAt: date(s.updatedAt),
    _legacyId: oid(s._id),
  };
}
function mapCourse(c) {
  return {
    tenantId: TENANT,
    name: c.courseName,
    fees: Number(c.courseFees) || 0,
    courseType: c.courseType ? String(c.courseType) : '',
    durationYears: Number(c.numberOfYears) || 0,
    category: c.category ? String(c.category) : '',
    subjects: c.subjects || [],
    isActive: true,
    createdBy: c.createdBy || 'migration',
    createdAt: date(c.createdAt),
    updatedAt: date(c.updatedAt),
    _legacyId: oid(c._id),
  };
}
function mapCompany(c) {
  return {
    _id: new ObjectId(oid(c._id)),
    tenantId: TENANT,
    categoryName: c.companyName,
    logo: c.logo || '',
    email: c.email || '',
    companyPhone: c.companyPhone || '',
    companyWebsite: c.companyWebsite || '',
    companyAddress: c.companyAddress || '',
    reciptNumber: c.reciptNumber || '',
    gst: c.gst || '',
    isGstBased: c.isGstBased || 'No',
    createdBy: 'system',
    createdAt: date(c.createdAt),
    updatedAt: date(c.updatedAt),
    _legacyId: oid(c._id),
  };
}
function mapFeePayment(f) {
  return {
    tenantId: TENANT,
    studentId: oid(f.studentInfo) || oid(f.studentId) || '',
    courseId: oid(f.courseId || f.courseName) || '',
    courseFees: Number(f.course_fees) || 0,
    discount: Number(f.discount) || 0,
    netFees: Number(f.netCourseFees) || 0,
    totalPaid: Number(f.totalPaid) || 0,
    remainingFees: Number(f.remainingCourseFees) || 0,
    paymentMode: f.paymentOption || '',
    receiptNumber: f.reciptNumber || '',
    amountPaid: Number(f.amountPaid) || 0,
    amountDate: f.amountDate ? date(f.amountDate) : undefined,
    narration: f.narration || '',
    lateFees: Number(f.lateFees) || 0,
    no_of_installments: Number(f.no_of_installments) || 0,
    no_of_installments_amount: Number(f.no_of_installments_amount) || 0,
    gst_percentage: Number(f.gst_percentage) || 0,
    studentInfo: oid(f.studentInfo),
    companyName: oid(f.companyName),
    courseName: oid(f.courseName),
    paymentOption: oid(f.paymentOption),
    addedBy: oid(f.addedBy),
    createdBy: oid(f.createdBy) || 'migration',
    createdAt: date(f.createdAt),
    updatedAt: date(f.updatedAt),
    _legacyId: oid(f._id),
    _raw: f,
  };
}
function mapInstallment(i) {
  return {
    tenantId: TENANT,
    studentId: oid(i.studentInfo) || '',
    companyId: oid(i.companyName) || '',
    courseId: oid(i.courseName) || '',
    expirationDate: i.expiration_date ? date(i.expiration_date) : null,
    installmentNumber: Number(i.installment_number) || 0,
    installmentAmount: Number(i.installment_amount) || 0,
    status: 'active',
    createdBy: 'migration',
    createdAt: date(i.createdAt),
    updatedAt: date(i.updatedAt),
    _legacyId: oid(i._id),
  };
}
function mapDaybookAccount(a) {
  return {
    tenantId: TENANT,
    accountName: a.accountName || '',
    accountType: a.accountType || 'Expense',
    companyId: oid(a.companyId) || '',
    isActive: true,
    createdBy: 'migration',
    createdAt: date(a.createdAt),
    updatedAt: date(a.updatedAt),
    _legacyId: oid(a._id),
  };
}
function mapDaybookEntry(e) {
  return {
    tenantId: TENANT,
    dayBookAccountId: oid(e.dayBookAccountId) || '',
    accountName: e.accountName || '',
    companyId: oid(e.companyId) || '',
    date: e.dayBookDatadate ? date(e.dayBookDatadate) : date(e.createdAt),
    debit: Number(e.debit) || 0,
    credit: Number(e.credit) || 0,
    balance: Number(e.balance) || 0,
    narration: e.naretion || e.narration || '',
    naretion: e.naretion || '',
    studentLateFees: Number(e.studentLateFees) || 0,
    rollNo: e.rollNo ? String(e.rollNo) : '',
    StudentName: e.StudentName || '',
    reciptNumber: e.reciptNumber ? String(e.reciptNumber) : '',
    studentInfo: oid(e.studentInfo) || '',
    createdBy: 'migration',
    createdAt: date(e.createdAt),
    updatedAt: date(e.updatedAt),
    _legacyId: oid(e._id),
  };
}

// ── Generic additive sync ──────────────────────────────────────────────────
async function additiveSync(db, label, devColl, sourceData, mapper, opts = {}) {
  const existing = await db.collection(devColl)
    .find({ tenantId: TENANT, _legacyId: { $exists: true } }, { projection: { _legacyId: 1 } })
    .toArray();
  const have = new Set(existing.map(d => d._legacyId));
  const missing = sourceData.filter(s => !have.has(oid(s._id)));
  log(`   ${label}: source=${sourceData.length} dev=${existing.length} missing=${missing.length}`);

  if (missing.length === 0) return { inserted: 0, scanned: sourceData.length };
  if (!APPLY) return { inserted: missing.length, scanned: sourceData.length, note: 'dry-run' };

  const docs = missing.map(s => mapper(s, opts)).filter(Boolean);
  let inserted = 0;
  const errors = [];
  for (const doc of docs) {
    try { await db.collection(devColl).insertOne(doc); inserted++; }
    catch (e) {
      if (e.code === 11000) errors.push({ legacyId: doc._legacyId, error: 'duplicate', detail: e.message.substring(0,200) });
      else throw e;
    }
  }
  if (errors.length) log(`   ⚠️  ${errors.length} insert errors`);
  log(`   ${label}: inserted ${inserted} / ${missing.length}`);
  return { inserted, scanned: sourceData.length, errors };
}

// ── Backfill missing company references on existing migrated docs ──────────
async function backfillCompanyRefs(db) {
  log('   Backfilling companyName / enrollment.companyId on existing migrated docs');
  let stuFixed = 0, feeFixed = 0;

  // Students
  const srcStu = load('students');
  const srcStuMap = new Map(srcStu.map(s => [oid(s._id), s]));
  const devStu = await db.collection('students')
    .find({ tenantId: TENANT, _legacyId: { $exists: true }, $or: [{ companyName: { $exists: false } }, { companyName: '' }, { companyName: null }, { companyName: undefined }] })
    .toArray();
  for (const d of devStu) {
    const p = srcStuMap.get(d._legacyId);
    if (!p?.companyName) continue;
    const cId = oid(p.companyName);
    const set = { companyName: cId, 'enrollment.companyId': cId };
    if (APPLY) {
      const r = await db.collection('students').updateOne({ _id: d._id }, { $set: set });
      if (r.modifiedCount === 1) stuFixed++;
    } else stuFixed++;
  }

  // Feepayments
  const srcFee = load('coursefees');
  const srcFeeMap = new Map(srcFee.map(f => [oid(f._id), f]));
  const devFee = await db.collection('feepayments')
    .find({ tenantId: TENANT, _legacyId: { $exists: true }, $or: [{ companyName: { $exists: false } }, { companyName: '' }, { companyName: null }] })
    .toArray();
  for (const d of devFee) {
    const p = srcFeeMap.get(d._legacyId);
    if (!p?.companyName) continue;
    const cId = oid(p.companyName);
    const set = { companyName: cId };
    // Also fill amountPaid/amountDate if missing
    if (d.amountPaid === undefined && p.amountPaid !== undefined) set.amountPaid = Number(p.amountPaid) || 0;
    if (!d.amountDate && p.amountDate) set.amountDate = date(p.amountDate);
    if (APPLY) {
      const r = await db.collection('feepayments').updateOne({ _id: d._id }, { $set: set });
      if (r.modifiedCount === 1) feeFixed++;
    } else feeFixed++;
  }

  log(`   companyName backfill: ${APPLY ? 'fixed' : 'would fix'} students=${stuFixed} feepayments=${feeFixed}`);
  return { stuFixed, feeFixed };
}

// ── Sync student financial drift ───────────────────────────────────────────
async function syncFinancialDrift(db) {
  log('   Syncing student financial drift on already-migrated docs');
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
  const prod = load('students');
  const prodById = new Map(prod.map(p => [oid(p._id), p]));
  const dev = await db.collection('students')
    .find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();

  let updated = 0;
  for (const d of dev) {
    const p = prodById.get(d._legacyId);
    if (!p) continue;
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
    } else updated++;
  }
  log(`   financial drift: ${APPLY ? 'updated' : 'would update'} ${updated} students`);
  return updated;
}

// ── Set up receipt counter to source's max ─────────────────────────────────
async function seedReceiptCounter(db) {
  const fees = load('coursefees');
  // detect prefix from any receipt — e.g. "WS-1013" → prefix=WS, max=1013
  const samples = fees.map(f => f.reciptNumber).filter(Boolean);
  const prefixCount = {};
  for (const r of samples) {
    const m = r.match(/^([A-Za-z]+)-?(\d+)$/);
    if (!m) continue;
    prefixCount[m[1]] = Math.max(prefixCount[m[1]] || 0, parseInt(m[2], 10));
  }
  const entries = Object.entries(prefixCount).sort((a,b) => b[1]-a[1]);
  if (!entries.length) { log('   no receipt prefix detected — skipping counter'); return null; }
  const [prefix, max] = entries[0];
  log(`   receipt counter: prefix=${prefix} maxObserved=${max}`);

  if (!APPLY) return { prefix, currentValue: max, note: 'dry-run' };

  const existing = await db.collection('receiptcounters').findOne({ tenantId: TENANT });
  if (existing) {
    if (existing.currentValue >= max) {
      log(`   counter already at ${existing.currentValue} ≥ ${max} — no change`);
      return { prefix: existing.prefix, currentValue: existing.currentValue };
    }
    await db.collection('receiptcounters').updateOne({ tenantId: TENANT },
      { $set: { currentValue: max, prefix, updatedAt: new Date() } });
    log(`   counter bumped: ${existing.currentValue} → ${max}`);
    return { prefix, currentValue: max };
  } else {
    await db.collection('receiptcounters').insertOne({
      tenantId: TENANT, prefix, currentValue: max, createdAt: new Date(), updatedAt: new Date(),
    });
    log(`   counter created: prefix=${prefix} value=${max}`);
    return { prefix, currentValue: max };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Tenant migration   tenant=${TENANT}   mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log('═══════════════════════════════════════════════════════');

  pullDumps();

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  try {
    // Pre-snapshot
    log('2. Pre-state snapshot (dev counts)');
    for (const c of ['students', 'courses', 'batchcategories', 'feepayments', 'feeinstallments', 'daybookaccounts', 'daybookentries']) {
      const n = await db.collection(c).countDocuments({ tenantId: TENANT });
      log(`   ${c}: ${n}`);
    }

    log('3. Additive sync (insert missing legacy docs)');

    // Build courseLegacyToDevId map (for student.enrollment.courseId resolution)
    const courseLegacyToDevId = new Map();
    const devCourses = await db.collection('courses').find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();
    devCourses.forEach(c => courseLegacyToDevId.set(c._legacyId, c._id.toString()));

    // 3.1 companies → batchcategories.
    // Strategy: if an existing batchcategory matches by tenantId+categoryName
    // (created during onboarding), just patch its _legacyId so legacyGateway's
    // companyIdMap can resolve student.companyName references to it.
    // Only insert (preserving _id) when no matching dev doc exists.
    {
      const src = load('companies');
      log(`   batchcategories: source=${src.length}`);
      let inserted = 0, patched = 0;
      for (const c of src) {
        const sourceId = oid(c._id);
        const sourceName = c.companyName;
        // Try to insert with original _id
        const exact = await db.collection('batchcategories').findOne({ _id: new ObjectId(sourceId) });
        if (exact) {
          // already imported with original _id — make sure _legacyId is set
          if (!exact._legacyId && APPLY) {
            await db.collection('batchcategories').updateOne({ _id: exact._id }, { $set: { _legacyId: sourceId } });
            patched++;
          }
          continue;
        }
        const sameName = await db.collection('batchcategories').findOne({ tenantId: TENANT, categoryName: sourceName });
        if (sameName) {
          // patch _legacyId only — never overwrite categoryName/_id
          if (!sameName._legacyId || sameName._legacyId !== sourceId) {
            if (APPLY) {
              await db.collection('batchcategories').updateOne({ _id: sameName._id }, { $set: { _legacyId: sourceId } });
              patched++;
            } else patched++;
          }
          continue;
        }
        // Truly new — insert preserving source _id
        if (APPLY) await db.collection('batchcategories').insertOne(mapCompany(c));
        inserted++;
      }
      log(`   batchcategories: inserted=${inserted} patched(_legacyId)=${patched}`);
    }

    // 3.2 courses
    await additiveSync(db, 'courses', 'courses', load('courses'), mapCourse);

    // refresh courseLegacyToDevId after insert
    const devCourses2 = await db.collection('courses').find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();
    devCourses2.forEach(c => courseLegacyToDevId.set(c._legacyId, c._id.toString()));

    // 3.3 students (with courseId resolution)
    await additiveSync(db, 'students', 'students', load('students'), s => mapStudent(s, courseLegacyToDevId));

    // 3.4 feepayments
    await additiveSync(db, 'feepayments', 'feepayments', load('coursefees'), mapFeePayment);

    // 3.5 feeinstallments
    await additiveSync(db, 'feeinstallments', 'feeinstallments', load('paymentinstallmenttimes'), mapInstallment);

    // 3.6 daybookaccounts
    await additiveSync(db, 'daybookaccounts', 'daybookaccounts', load('daybookaccounts'), mapDaybookAccount);

    // 3.7 daybookentries
    await additiveSync(db, 'daybookentries', 'daybookentries', load('daybookdatas'), mapDaybookEntry);

    log('4a. Backfill missing companyName references on existing migrated docs');
    await backfillCompanyRefs(db);

    log('4b. Sync financial drift on existing students');
    await syncFinancialDrift(db);

    log('5. Seed receipt counter');
    await seedReceiptCounter(db);

    // Post-snapshot
    log('6. Post-state snapshot');
    for (const c of ['students', 'courses', 'batchcategories', 'feepayments', 'feeinstallments', 'daybookaccounts', 'daybookentries']) {
      const n = await db.collection(c).countDocuments({ tenantId: TENANT });
      log(`   ${c}: ${n}`);
    }

  } finally { await mongoose.disconnect(); }
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
