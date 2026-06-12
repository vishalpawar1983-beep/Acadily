#!/usr/bin/env node
/**
 * VPS-native daily sync — runs ON the VPS via cron. Connects directly to
 * the local source Mongo databases (no ssh) and to dev Atlas.
 *
 * Deploy:
 *   scp this file to /opt/flex-academy/scripts/vps-daily-sync.cjs
 *   crontab entry: 17 3 * * *  /usr/bin/node /opt/flex-academy/scripts/vps-daily-sync.cjs >> /var/log/flex-daily-sync.log 2>&1
 *
 * Env (loaded from /opt/flex-academy/.env.daily-sync):
 *   MONGO_URI       — Atlas connection (dev/app.acadily.com)
 *
 * What it does per tenant (all idempotent, additive-only):
 *   1. mongoexport fresh collections from source VPS DB
 *   2. Sync 8 student enrollment financial fields from prod (only deltas updated)
 *   3. Insert any new prod docs (by _legacyId) into:
 *      students, courses, feepayments, feeinstallments, daybookaccounts, daybookentries
 *      Also patches batchcategory _legacyId (handles onboarding-created docs)
 *   4. Bumps receiptcounters.currentValue to prod max BEFORE inserting feepayments
 *   5. Reports orphans (dev docs whose _legacyId no longer exists on prod) — never deletes
 */
const fs = require('fs');
const { execSync } = require('child_process');

// ── Load .env ──
const ENV_FILE = '/opt/flex-academy/.env.daily-sync';
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const TENANTS = [
  { tenant: 'ims_reliance', sourceUri: 'mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore' },
  { tenant: 'chanakya',     sourceUri: 'mongodb://chanakyaapp:chanakya12345@127.0.0.1:27017/Chanakya?authSource=Chanakya' },
  { tenant: 'webliquid',    sourceUri: 'mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27017/webliquidStudio?authSource=admin' },
];
const APPLY = process.env.APPLY !== 'false';
const DUMP_DIR = '/tmp';
let TENANT;
const COLLECTIONS = ['students', 'courses', 'companies', 'coursefees', 'paymentinstallmenttimes', 'daybookaccounts', 'daybookdatas'];

const log = (msg, ...args) => console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
const oid = v => v?.$oid || v?.toString?.() || v;
const date = v => v ? new Date(v?.$date || v) : new Date();
const load = c => JSON.parse(fs.readFileSync(`${DUMP_DIR}/${TENANT}_${c}_fresh.json`, 'utf8'));

function pullDumps(tenant, sourceUri) {
  log(`1. Exporting fresh prod collections for ${tenant}`);
  for (const c of COLLECTIONS) {
    const out = `${DUMP_DIR}/${tenant}_${c}_fresh.json`;
    try {
      execSync(`mongoexport --quiet --uri='${sourceUri}' --collection=${c} --jsonArray > ${out}`, { stdio: 'pipe' });
    } catch (e) {
      fs.writeFileSync(out, '[]');
    }
  }
}

// ── Mappers (legacy → DDD) ──
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
    createdBy: c.createdBy || 'sync',
    createdAt: date(c.createdAt),
    updatedAt: date(c.updatedAt),
    _legacyId: oid(c._id),
  };
}
function mapFeePayment(p) {
  return {
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
    _legacyId: oid(p._id),
    _raw: p,
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
    createdBy: 'sync',
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
    createdBy: 'sync',
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
    naretion: e.naretion || '', // legacy typo'd alias — frontend reads this for main col
    studentLateFees: Number(e.studentLateFees) || 0,
    // Denormalized student info — populated at INSERT time on prod, must mirror here
    rollNo: e.rollNo ? String(e.rollNo) : '',
    StudentName: e.StudentName || '',
    reciptNumber: e.reciptNumber ? String(e.reciptNumber) : '',
    studentInfo: oid(e.studentInfo) || '',
    createdBy: 'sync',
    createdAt: date(e.createdAt),
    updatedAt: date(e.updatedAt),
    _legacyId: oid(e._id),
  };
}

async function additiveInsert(db, label, devColl, sourceData, mapper, mapperArg) {
  if (!sourceData?.length) return { inserted: 0, scanned: 0 };
  const existing = await db.collection(devColl)
    .find({ tenantId: TENANT, _legacyId: { $exists: true } }, { projection: { _legacyId: 1 } }).toArray();
  const have = new Set(existing.map(d => d._legacyId));
  const missing = sourceData.filter(s => !have.has(oid(s._id)));
  if (missing.length === 0) return { inserted: 0, scanned: sourceData.length };
  if (!APPLY) { log(`   ${label}: ${missing.length} would insert`); return { inserted: missing.length, scanned: sourceData.length, note: 'dry-run' }; }
  let inserted = 0;
  for (const s of missing) {
    try {
      await db.collection(devColl).insertOne(mapper(s, mapperArg));
      inserted++;
    } catch (e) {
      if (e.code !== 11000) throw e;
    }
  }
  log(`   ${label}: inserted ${inserted}/${missing.length}`);
  return { inserted, scanned: sourceData.length };
}

// ── Sync student financial fields (8 enrollment fields) ──
async function syncStudentFinancials(db) {
  const SPEC = [
    ['enrollment.remainingFees', 'remainingCourseFees'],
    ['enrollment.totalPaid', 'totalPaid'],
    ['enrollment.netFees', 'netCourseFees'],
    ['enrollment.installmentAmount', 'no_of_installments_amount'],
    ['enrollment.installmentCount', 'no_of_installments'],
    ['enrollment.downPayment', 'down_payment'],
    ['enrollment.discount', 'discount'],
    ['enrollment.courseFees', 'course_fees'],
  ];
  const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const prod = load('students');
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
    } else updated++;
  }
  return { scanned, updated };
}

// ── Patch batchcategory _legacyId (handles onboarding-created docs) ──
async function patchBatchcategory(db) {
  const src = load('companies');
  let patched = 0, inserted = 0;
  for (const c of src) {
    const sourceId = oid(c._id);
    const exact = await db.collection('batchcategories').findOne({ _id: new ObjectId(sourceId) });
    if (exact) {
      if (!exact._legacyId && APPLY) {
        await db.collection('batchcategories').updateOne({ _id: exact._id }, { $set: { _legacyId: sourceId } });
        patched++;
      }
      continue;
    }
    const sameName = await db.collection('batchcategories').findOne({ tenantId: TENANT, categoryName: c.companyName });
    if (sameName) {
      if (sameName._legacyId !== sourceId && APPLY) {
        await db.collection('batchcategories').updateOne({ _id: sameName._id }, { $set: { _legacyId: sourceId } });
        patched++;
      }
      continue;
    }
    if (APPLY) {
      await db.collection('batchcategories').insertOne({
        _id: new ObjectId(sourceId), tenantId: TENANT,
        categoryName: c.companyName, logo: c.logo || '', email: c.email || '',
        companyPhone: c.companyPhone || '', companyWebsite: c.companyWebsite || '',
        companyAddress: c.companyAddress || '', reciptNumber: c.reciptNumber || '',
        gst: c.gst || '', isGstBased: c.isGstBased || 'No',
        createdBy: 'sync', createdAt: date(c.createdAt), updatedAt: date(c.updatedAt),
        _legacyId: sourceId,
      });
      inserted++;
    }
  }
  return { patched, inserted };
}

// ── Bump receipt counter to prod max BEFORE feepayment inserts ──
async function bumpReceiptCounter(db) {
  const prod = load('coursefees');
  let maxR = 0, prefix = null;
  for (const p of prod) {
    const m = (p.reciptNumber || '').match(/^([A-Za-z]+)-?(\d+)$/);
    if (!m) continue;
    const n = parseInt(m[2], 10);
    if (n > maxR) { maxR = n; prefix = m[1]; }
  }
  if (maxR === 0) return null;
  const c = await db.collection('receiptcounters').findOne({ tenantId: TENANT });
  if (c && c.currentValue >= maxR) return { prefix, currentValue: c.currentValue, bumped: false };
  if (!APPLY) return { prefix, currentValue: maxR, bumped: 'dry-run' };
  if (c) {
    await db.collection('receiptcounters').updateOne(
      { tenantId: TENANT },
      { $set: { currentValue: maxR, prefix: prefix || c.prefix, updatedAt: new Date() } }
    );
    return { prefix, currentValue: maxR, bumped: `${c.currentValue} → ${maxR}` };
  } else {
    await db.collection('receiptcounters').insertOne({
      tenantId: TENANT, prefix, currentValue: maxR, createdAt: new Date(), updatedAt: new Date(),
    });
    return { prefix, currentValue: maxR, bumped: `created at ${maxR}` };
  }
}

// ── Detect orphans (report only) ──
async function detectOrphans(db) {
  const out = {};
  for (const [label, devColl, srcColl] of [
    ['feepayments', 'feepayments', 'coursefees'],
    ['feeinstallments', 'feeinstallments', 'paymentinstallmenttimes'],
    ['students', 'students', 'students'],
    ['courses', 'courses', 'courses'],
    ['daybookentries', 'daybookentries', 'daybookdatas'],
  ]) {
    try {
      const prod = load(srcColl);
      const prodIds = new Set(prod.map(p => oid(p._id)));
      const dev = await db.collection(devColl).find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();
      const orphans = dev.filter(d => !prodIds.has(d._legacyId));
      out[label] = { dev: dev.length, prod: prod.length, orphans: orphans.length };
    } catch { out[label] = { error: true }; }
  }
  return out;
}

// ── Per-tenant orchestration ──
async function syncOneTenant(db, tenant, sourceUri) {
  const t0 = Date.now();
  TENANT = tenant;
  console.log('───────────────────────────────────────────────────');
  console.log(`  Tenant: ${tenant}`);
  console.log('───────────────────────────────────────────────────');

  pullDumps(tenant, sourceUri);

  // 1. Patch batchcategory _legacyId (must come before students for companyId resolution)
  const bc = await patchBatchcategory(db);
  if (bc.patched || bc.inserted) log(`   batchcategories: patched=${bc.patched} inserted=${bc.inserted}`);

  // 2. Insert new courses (must come before students for course-id resolution)
  const newCourses = await additiveInsert(db, 'courses', 'courses', load('courses'), mapCourse);

  // 3. Build courseLegacyToDevId map for student insertion
  const courseLegacyToDevId = new Map();
  const devCourses = await db.collection('courses').find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();
  devCourses.forEach(c => courseLegacyToDevId.set(c._legacyId, c._id.toString()));

  // 4. Insert new students
  const newStudents = await additiveInsert(db, 'students', 'students', load('students'),
    s => mapStudent(s, courseLegacyToDevId));

  // 5. Sync student financial drift
  const fin = await syncStudentFinancials(db);
  if (fin.updated) log(`   student financials: scanned=${fin.scanned} updated=${fin.updated}`);

  // 6. Bump receipt counter BEFORE inserting feepayments
  const counter = await bumpReceiptCounter(db);
  if (counter?.bumped) log(`   receipt counter: ${counter.bumped} (prefix=${counter.prefix})`);

  // 7. Insert new feepayments
  const newFees = await additiveInsert(db, 'feepayments', 'feepayments', load('coursefees'), mapFeePayment);

  // 8. Insert new feeinstallments
  const newInst = await additiveInsert(db, 'feeinstallments', 'feeinstallments', load('paymentinstallmenttimes'), mapInstallment);

  // 9. Insert new daybookaccounts
  const newDA = await additiveInsert(db, 'daybookaccounts', 'daybookaccounts', load('daybookaccounts'), mapDaybookAccount);

  // 10. Insert new daybookentries
  const newDE = await additiveInsert(db, 'daybookentries', 'daybookentries', load('daybookdatas'), mapDaybookEntry);

  // 11. Detect orphans (report only)
  const orphans = await detectOrphans(db);

  log(`SUMMARY ${tenant} ${Date.now() - t0}ms: ` + JSON.stringify({
    inserts: { students: newStudents.inserted, courses: newCourses.inserted, feepayments: newFees.inserted,
               feeinstallments: newInst.inserted, daybookaccounts: newDA.inserted, daybookentries: newDE.inserted },
    financials: fin, counter: counter?.bumped || null, orphans,
  }));
}

async function run() {
  const t0 = Date.now();
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  VPS daily sync — ${TENANTS.length} tenants — mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log('═══════════════════════════════════════════════════════');

  if (!process.env.MONGO_URI) { console.error('ABORT: MONGO_URI not set'); process.exit(2); }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  try {
    for (const { tenant, sourceUri } of TENANTS) {
      try { await syncOneTenant(db, tenant, sourceUri); }
      catch (e) { console.error(`FAILED tenant=${tenant}:`, e.message); }
    }
  } finally { await mongoose.disconnect(); }
  log(`════════ TOTAL DURATION ${Date.now() - t0}ms ════════`);
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
