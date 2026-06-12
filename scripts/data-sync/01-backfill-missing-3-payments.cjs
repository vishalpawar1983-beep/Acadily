/**
 * Targeted additive backfill: insert 3 specific missing coursefees from prod
 * into dev feepayments. Idempotent — checks by _legacyId before inserting.
 *
 * Missing receipts identified via diff: VM-2771, VM-2772, VM-2773
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const TENANT = 'ims_reliance';
const TARGET_LEGACY_IDS = [
  '69c0d238235c8bb45886966c', // VM-2771
  '69c0eeb5235c8bb45886adb6', // VM-2772
  '69c0f080235c8bb45886ae11', // VM-2773
];

function oid(v) { return v?.$oid || v?.toString?.() || v; }
function date(v) { return v ? new Date(v?.$date || v) : new Date(); }

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // Use FRESH prod dump (preferred) — fall back to the original full dump
  const fresh = JSON.parse(fs.readFileSync('/tmp/prod_coursefees_fresh.json', 'utf8'));
  const targets = fresh.filter(c => TARGET_LEGACY_IDS.includes(oid(c._id)));

  console.log('Found in prod fresh dump:', targets.length, '/', TARGET_LEGACY_IDS.length);
  if (targets.length !== TARGET_LEGACY_IDS.length) {
    console.error('ABORT: not all 3 receipts present in fresh prod dump');
    await mongoose.disconnect();
    process.exit(1);
  }

  const toInsert = [];
  let skipped = 0;

  for (const f of targets) {
    const prodId = oid(f._id);
    const existing = await db.collection('feepayments').findOne({ tenantId: TENANT, _legacyId: prodId });
    if (existing) {
      console.log('  SKIP (already in dev):', f.reciptNumber, prodId);
      skipped++;
      continue;
    }

    const mapped = {
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
      createdBy: oid(f.createdBy) || 'migration',
      createdAt: date(f.createdAt),
      updatedAt: date(f.updatedAt),
      _legacyId: prodId,
      _raw: f,
    };
    toInsert.push(mapped);
    console.log('  STAGE:', f.reciptNumber, '|', prodId, '| createdAt=', mapped.createdAt.toISOString());
  }

  console.log('\nTo insert:', toInsert.length, '| Skipped (already present):', skipped);

  if (toInsert.length === 0) {
    console.log('Nothing to insert. Dev is already in sync for these 3 receipts.');
    await mongoose.disconnect();
    return;
  }

  // DRY-RUN guard: require explicit env var to actually insert
  if (process.env.APPLY !== 'true') {
    console.log('\n[DRY-RUN] Set APPLY=true to actually insert.');
    await mongoose.disconnect();
    return;
  }

  const res = await db.collection('feepayments').insertMany(toInsert, { ordered: true });
  console.log('\n✓ INSERTED:', res.insertedCount, 'docs into feepayments');

  // Verify
  for (const id of TARGET_LEGACY_IDS) {
    const doc = await db.collection('feepayments').findOne({ tenantId: TENANT, _legacyId: id });
    console.log('  verify', id, '→', doc ? `present (${doc.receiptNumber})` : 'MISSING');
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
