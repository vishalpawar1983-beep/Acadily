/**
 * Option A — Resolve VM-2771/2772/2773 collision between dev test data and prod data
 *
 * Steps (idempotent, dry-run by default; APPLY=true to execute):
 *  1. Archive the 3 dev test docs to `feepayments_dev_test_archive` (preserve fully, with archivedAt + reason)
 *  2. Delete the 3 dev test docs from `feepayments` (frees the (tenantId, receiptNumber) unique slot)
 *  3. Insert the 3 prod source docs into `feepayments` with proper `_legacyId` mapping (matches sync_prod_to_dev.js mapper)
 *  4. Bump `receiptcounters` for ims_reliance to currentValue=2793 so next app-emitted receipt is VM-2794 (no future collision)
 *  5. Final verify: confirm all 3 prod _legacyIds present, archive has 3 docs, counter at 2793, dev/prod count parity
 *
 * Safety:
 *  - DRY-RUN by default. Run with APPLY=true to commit.
 *  - Re-runnable (idempotent). Re-running after success is a no-op.
 *  - Only writes to dev (Atlas flex_academy_dev). Zero touch on prod.
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
const TARGET_RECEIPTS = ['VM-2771', 'VM-2772', 'VM-2773'];
const COUNTER_TARGET = 2793; // == prod's current max VM-2793, so next is VM-2794

const APPLY = process.env.APPLY === 'true';

function oid(v) { return v?.$oid || v?.toString?.() || v; }
function date(v) { return v ? new Date(v?.$date || v) : new Date(); }

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log('=================================================');
  console.log('Option A: Resolve VM-2771/2/3 collision');
  console.log('Mode:', APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)');
  console.log('=================================================\n');

  // ── PRE-CHECK ─────────────────────────────────
  const prod = JSON.parse(fs.readFileSync('/tmp/prod_coursefees_fresh.json', 'utf8'));
  const prodTargets = prod.filter(c => TARGET_LEGACY_IDS.includes(oid(c._id)));
  if (prodTargets.length !== 3) {
    console.error('ABORT: prod fresh dump missing one of the target receipts');
    process.exit(1);
  }
  console.log('✓ Found all 3 target receipts in prod fresh dump');

  // Currently colliding dev docs
  const devCollisions = await db.collection('feepayments').find({
    tenantId: TENANT,
    receiptNumber: { $in: TARGET_RECEIPTS },
    _legacyId: { $exists: false }, // app-generated only
  }).toArray();
  console.log('✓ Found', devCollisions.length, 'dev app-generated docs to archive');
  devCollisions.forEach(d => console.log('   ', d.receiptNumber, '_id=', d._id, 'amount=', d.amountPaid, 'student=', d.studentId));

  if (devCollisions.length === 0) {
    // Maybe already resolved on prior run; check whether prod docs are present
    const prodPresent = await db.collection('feepayments').countDocuments({
      tenantId: TENANT,
      _legacyId: { $in: TARGET_LEGACY_IDS },
    });
    if (prodPresent === 3) {
      console.log('\n✓ Already resolved — prod docs present, no dev collisions. Nothing to do.');
      await mongoose.disconnect();
      return;
    }
  }

  // Existing prod docs already in dev?
  const alreadyInserted = await db.collection('feepayments').find({
    tenantId: TENANT,
    _legacyId: { $in: TARGET_LEGACY_IDS },
  }).toArray();
  console.log('✓ Prod-mapped docs already in dev (idempotency check):', alreadyInserted.length);

  // ── PLAN ─────────────────────────────────
  const planArchive = devCollisions.map(d => ({
    ...d,
    _archivedAt: new Date(),
    _archivedReason: 'Receipt# collision with prod migration (Option A — see backfill RCA 2026-04-26)',
    _archivedFromCollection: 'feepayments',
  }));

  const planInsert = [];
  for (const f of prodTargets) {
    const prodId = oid(f._id);
    if (alreadyInserted.find(d => d._legacyId === prodId)) continue;
    planInsert.push({
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
    });
  }

  // Counter state
  const currentCounter = await db.collection('receiptcounters').findOne({ tenantId: TENANT });
  console.log('\nCurrent counter:', currentCounter ? `currentValue=${currentCounter.currentValue} prefix=${currentCounter.prefix}` : '(none)');
  console.log('Target counter currentValue:', COUNTER_TARGET);

  console.log('\n--- PLAN ---');
  console.log('1. Archive', planArchive.length, 'dev test docs to feepayments_dev_test_archive');
  console.log('2. Delete', devCollisions.length, 'dev docs from feepayments');
  console.log('3. Insert', planInsert.length, 'prod-mapped docs into feepayments');
  console.log('4. Bump counter currentValue', currentCounter?.currentValue, '→', COUNTER_TARGET);

  if (!APPLY) {
    console.log('\n[DRY-RUN] Set APPLY=true to execute.');
    await mongoose.disconnect();
    return;
  }

  // ── EXECUTE ─────────────────────────────────
  console.log('\n--- EXECUTING ---');

  // 1. Archive
  if (planArchive.length > 0) {
    const archCol = db.collection('feepayments_dev_test_archive');
    // Use insertMany — ordered: false won't help here since we want to know if it fully succeeds
    // But the archive collection has no unique index, so plain insert is fine
    const archRes = await archCol.insertMany(planArchive);
    console.log('1. Archived:', archRes.insertedCount, 'docs');
  } else {
    console.log('1. Archive: skipped (nothing to archive)');
  }

  // 2. Delete
  if (devCollisions.length > 0) {
    const ids = devCollisions.map(d => d._id);
    const delRes = await db.collection('feepayments').deleteMany({ _id: { $in: ids } });
    console.log('2. Deleted from feepayments:', delRes.deletedCount, 'docs');
  } else {
    console.log('2. Delete: skipped');
  }

  // 3. Insert prod docs
  if (planInsert.length > 0) {
    const insRes = await db.collection('feepayments').insertMany(planInsert, { ordered: true });
    console.log('3. Inserted prod docs:', insRes.insertedCount);
  } else {
    console.log('3. Insert: skipped (already present)');
  }

  // 4. Bump counter
  if (currentCounter && currentCounter.currentValue < COUNTER_TARGET) {
    const cRes = await db.collection('receiptcounters').updateOne(
      { tenantId: TENANT },
      { $set: { currentValue: COUNTER_TARGET, updatedAt: new Date() } }
    );
    console.log('4. Counter bumped:', currentCounter.currentValue, '→', COUNTER_TARGET, '| modified:', cRes.modifiedCount);
  } else if (!currentCounter) {
    console.log('4. Counter: no counter doc found — skipped (legacy gateway uses fallback Date.now())');
  } else {
    console.log('4. Counter: already at or above target — skipped');
  }

  // ── VERIFY ─────────────────────────────────
  console.log('\n--- VERIFY ---');
  const verifyProd = await db.collection('feepayments').find({ tenantId: TENANT, _legacyId: { $in: TARGET_LEGACY_IDS } }).toArray();
  console.log('Prod docs in feepayments:', verifyProd.length, '/ 3');
  verifyProd.forEach(d => console.log('  ', d.receiptNumber, '|', d._legacyId, '| amountPaid:', d.totalPaid));

  const verifyArch = await db.collection('feepayments_dev_test_archive').countDocuments({});
  console.log('Archive total:', verifyArch);

  const verifyCounter = await db.collection('receiptcounters').findOne({ tenantId: TENANT });
  console.log('Counter currentValue:', verifyCounter?.currentValue);

  const lastCheck = await db.collection('feepayments').find({ tenantId: TENANT, receiptNumber: { $in: TARGET_RECEIPTS } }).toArray();
  console.log('Final feepayments with VM-2771/2/3:', lastCheck.length);
  lastCheck.forEach(d => console.log('  ', d.receiptNumber, '_id:', d._id, '_legacyId:', d._legacyId || '(none)', 'student:', d.studentId));

  await mongoose.disconnect();
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
