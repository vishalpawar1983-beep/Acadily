/**
 * Sync dev student financial fields from prod (idempotent, dry-run by default).
 *
 * For each dev student with _legacyId matching a prod student, update only
 * the financial fields that drifted, preserving everything else.
 *
 * Source: /tmp/prod_students_fresh.json (read-only, exported from VPS prod)
 * Target: dev Atlas (flex_academy_dev)
 *
 * Set APPLY=true to actually write.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const TENANT = 'ims_reliance';
const APPLY = process.env.APPLY === 'true';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const prod = JSON.parse(fs.readFileSync('/tmp/prod_students_fresh.json'));
  const prodById = new Map(prod.map(p => [p._id?.$oid || p._id, p]));

  const dev = await db.collection('students').find({ tenantId: TENANT, _legacyId: { $exists: true } }).toArray();

  console.log('=================================================');
  console.log('Sync dev student financials FROM prod (READ-ONLY on prod)');
  console.log('Mode:', APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)');
  console.log('=================================================\n');
  console.log('Prod students:', prod.length, '| Dev students w _legacyId:', dev.length);

  const updates = [];
  for (const d of dev) {
    const p = prodById.get(d._legacyId);
    if (!p) continue;

    const target = {
      remainingFees: Number(p.remainingCourseFees) || 0,
      totalPaid: Number(p.totalPaid) || 0,
      netFees: Number(p.netCourseFees) || 0,
    };
    const current = {
      remainingFees: Number(d.enrollment?.remainingFees) || 0,
      totalPaid: Number(d.enrollment?.totalPaid) || 0,
      netFees: Number(d.enrollment?.netFees) || 0,
    };

    const setFields = {};
    if (current.remainingFees !== target.remainingFees) setFields['enrollment.remainingFees'] = target.remainingFees;
    if (current.totalPaid !== target.totalPaid) setFields['enrollment.totalPaid'] = target.totalPaid;
    if (current.netFees !== target.netFees) setFields['enrollment.netFees'] = target.netFees;

    if (Object.keys(setFields).length === 0) continue;

    updates.push({
      _id: d._id,
      roll: d.rollNumber,
      name: (d.firstName || '') + ' ' + (d.lastName || ''),
      legacyId: d._legacyId,
      current,
      target,
      setFields,
    });
  }

  console.log('\nStudents needing update:', updates.length);
  console.log('---');
  updates.forEach(u => {
    const changes = Object.entries(u.setFields).map(([k, v]) => `${k.replace('enrollment.','')}=${u.current[k.replace('enrollment.','')]}→${v}`).join(', ');
    console.log('  roll', String(u.roll).padEnd(6), '|', u.name.padEnd(28), '|', changes);
  });

  if (!APPLY) {
    console.log('\n[DRY-RUN] Set APPLY=true to execute.');
    await mongoose.disconnect();
    return;
  }

  console.log('\n--- EXECUTING ---');
  let modified = 0;
  for (const u of updates) {
    const r = await db.collection('students').updateOne(
      { _id: u._id, tenantId: TENANT },
      { $set: u.setFields }
    );
    if (r.modifiedCount === 1) modified++;
  }
  console.log('Modified:', modified, '/', updates.length);

  console.log('\n--- VERIFY: re-checking 3 problem students ---');
  for (const roll of ['1236', '1241', '1286']) {
    const s = await db.collection('students').findOne({ tenantId: TENANT, rollNumber: roll });
    console.log('  roll', roll, '|', (s?.firstName||'').trim(), '| enrollment.remainingFees:', s?.enrollment?.remainingFees, '| totalPaid:', s?.enrollment?.totalPaid);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
