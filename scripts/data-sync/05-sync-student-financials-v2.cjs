/**
 * v2: Comprehensive student financial sync from prod (idempotent, dry-run).
 * Adds installmentAmount, installmentCount, downPayment, discount, courseFees
 * to the original 3 fields (remainingFees, totalPaid, netFees).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const TENANT = 'ims_reliance';
const APPLY = process.env.APPLY === 'true';

// prod field → dev enrollment.<field>
const SPEC = [
  { dev: 'enrollment.remainingFees',     prod: 'remainingCourseFees',       cast: 'num' },
  { dev: 'enrollment.totalPaid',         prod: 'totalPaid',                  cast: 'num' },
  { dev: 'enrollment.netFees',           prod: 'netCourseFees',              cast: 'num' },
  { dev: 'enrollment.installmentAmount', prod: 'no_of_installments_amount',  cast: 'num' },
  { dev: 'enrollment.installmentCount',  prod: 'no_of_installments',         cast: 'num' },
  { dev: 'enrollment.downPayment',       prod: 'down_payment',               cast: 'num' },
  { dev: 'enrollment.discount',          prod: 'discount',                   cast: 'num' },
  { dev: 'enrollment.courseFees',        prod: 'course_fees',                cast: 'num' },
];

const get = (o, path) => path.split('.').reduce((a,k) => a?.[k], o);
const castVal = (v, k) => k === 'num' ? (Number(v) || 0) : v;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const prod = JSON.parse(fs.readFileSync('/tmp/prod_students_fresh.json'));
  const prodById = new Map(prod.map(p => [p._id?.$oid || p._id, p]));

  const dev = await db.collection('students').find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();

  console.log('=================================================');
  console.log('Comprehensive student financial sync v2');
  console.log('Mode:', APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)');
  console.log('=================================================\n');

  const updates = [];
  for (const d of dev) {
    const p = prodById.get(d._legacyId);
    if (!p) continue;
    const set = {};
    const diffs = [];
    for (const s of SPEC) {
      const dv = castVal(get(d, s.dev), s.cast);
      const pv = castVal(p[s.prod], s.cast);
      if (dv !== pv) {
        set[s.dev] = pv;
        diffs.push(`${s.dev.replace('enrollment.','')}: ${dv}→${pv}`);
      }
    }
    if (Object.keys(set).length === 0) continue;
    updates.push({ _id: d._id, roll: d.rollNumber, name: d.firstName + ' ' + (d.lastName||''), set, diffs });
  }

  console.log('Students needing update:', updates.length);
  console.log('---');
  updates.forEach(u => console.log('  roll', String(u.roll).padEnd(6), '|', u.name.padEnd(28), '|', u.diffs.join(', ')));

  if (!APPLY) {
    console.log('\n[DRY-RUN] Set APPLY=true to execute.');
    await mongoose.disconnect();
    return;
  }

  let modified = 0;
  for (const u of updates) {
    const r = await db.collection('students').updateOne(
      { _id: u._id, tenantId: TENANT },
      { $set: u.set }
    );
    if (r.modifiedCount === 1) modified++;
  }
  console.log('\n✓ Modified:', modified, '/', updates.length);

  await mongoose.disconnect();
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
