/**
 * Backfill top-level fields from _raw on 37 migrated feepayments.
 * The newer sync_prod_to_dev.js mapper stored prod-source fields under _raw
 * but failed to mirror amountPaid, amountDate, narration, lateFees etc. at
 * top level — which the legacy endpoints read.
 *
 * Idempotent: only writes fields that are missing at top level.
 * DRY-RUN by default; APPLY=true to commit.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const TENANT = 'ims_reliance';
const APPLY = process.env.APPLY === 'true';

// Map of _raw field → top-level field name (rename when prod uses snake_case typo)
const FIELD_MAP = [
  { raw: 'amountPaid',                top: 'amountPaid',                cast: 'number' },
  { raw: 'amountDate',                top: 'amountDate',                cast: 'date' },
  { raw: 'narration',                 top: 'narration',                 cast: 'string' },
  { raw: 'lateFees',                  top: 'lateFees',                  cast: 'number' },
  { raw: 'no_of_installments',        top: 'no_of_installments',        cast: 'number' },
  { raw: 'no_of_installments_amount', top: 'no_of_installments_amount', cast: 'number' },
  { raw: 'gst_percentage',            top: 'gst_percentage',            cast: 'number' },
  { raw: 'studentInfo',               top: 'studentInfo',               cast: 'oid' },
  { raw: 'companyName',               top: 'companyName',               cast: 'oid' },
  { raw: 'courseName',                top: 'courseName',                cast: 'oid' },
  { raw: 'paymentOption',             top: 'paymentOption',             cast: 'oid' },
  { raw: 'addedBy',                   top: 'addedBy',                   cast: 'oid' },
];

function castVal(v, kind) {
  if (v === undefined || v === null) return undefined;
  if (kind === 'number') return Number(v) || 0;
  if (kind === 'date')   return v ? new Date(v?.$date || v) : undefined;
  if (kind === 'string') return String(v);
  if (kind === 'oid')    return v?.$oid || (typeof v === 'string' ? v : v?.toString?.());
  return v;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log('=================================================');
  console.log('Backfill top-level fields on migrated feepayments');
  console.log('Mode:', APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)');
  console.log('=================================================\n');

  const docs = await db.collection('feepayments')
    .find({ tenantId: TENANT, _legacyId: { $exists: true }, amountPaid: { $exists: false } })
    .toArray();
  console.log('Targets (migrated, missing top-level amountPaid):', docs.length);

  let plannedUpdates = 0;
  let totalAmountSum = 0;
  let modifiedCount = 0;

  for (const d of docs) {
    const set = {};
    for (const m of FIELD_MAP) {
      const rawVal = d._raw?.[m.raw];
      if (rawVal === undefined || rawVal === null) continue;
      if (d[m.top] !== undefined && d[m.top] !== null) continue; // don't overwrite
      const v = castVal(rawVal, m.cast);
      if (v === undefined) continue;
      set[m.top] = v;
    }

    if (Object.keys(set).length === 0) continue;
    plannedUpdates++;
    if (set.amountPaid) totalAmountSum += set.amountPaid;

    if (!APPLY) continue;

    const r = await db.collection('feepayments').updateOne(
      { _id: d._id },
      { $set: set }
    );
    if (r.modifiedCount === 1) modifiedCount++;
  }

  console.log('\nDocs that need updates:', plannedUpdates);
  console.log('Sum of amountPaid being added:', totalAmountSum);

  if (!APPLY) {
    // Show first 5 docs that would be updated
    console.log('\nSample plan (first 5):');
    let shown = 0;
    for (const d of docs) {
      if (shown >= 5) break;
      const set = {};
      for (const m of FIELD_MAP) {
        const rawVal = d._raw?.[m.raw];
        if (rawVal === undefined || rawVal === null) continue;
        if (d[m.top] !== undefined && d[m.top] !== null) continue;
        const v = castVal(rawVal, m.cast);
        if (v !== undefined) set[m.top] = v;
      }
      if (Object.keys(set).length === 0) continue;
      shown++;
      console.log('  ', d.receiptNumber, '|', JSON.stringify(set, null, 0).substring(0, 200));
    }
    console.log('\n[DRY-RUN] Set APPLY=true to execute.');
  } else {
    console.log('\n✓ Modified:', modifiedCount, '/', plannedUpdates);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
