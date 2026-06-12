/**
 * Archive + delete orphans: dev docs whose _legacyId no longer exists on prod
 * (because prod has since deleted them). Restores prod-dev parity.
 *
 * Covers 4 collections: students, feepayments, feeinstallments, daybookentries.
 *
 * Strategy (Option A pattern, idempotent):
 *   1. Pull fresh prod dumps via SSH+mongoexport
 *   2. Archive each orphan to {coll}_orphan_archive (with _archivedAt + reason)
 *   3. Delete from live collections
 *   4. Verify
 *
 * APPLY=true to commit. Dry-run by default.
 *
 * Tenant via TENANT env var (default ims_reliance).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { execSync } = require('child_process');

const TENANT = process.env.TENANT || 'ims_reliance';
const APPLY = process.env.APPLY === 'true';
const VPS_PASSWORD = process.env.PROD_VPS_PASSWORD || 'zQ>iaRo';
const VPS_HOST = process.env.PROD_VPS_HOST || 'root@66.116.207.89';

const SOURCE_URI_BY_TENANT = {
  ims_reliance: 'mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore',
  chanakya:     'mongodb://chanakyaapp:chanakya12345@127.0.0.1:27017/Chanakya?authSource=Chanakya',
  webliquid:    'mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27017/webliquidStudio?authSource=admin',
};

function pullProd(tenant, srcCollection, label) {
  const sourceUri = SOURCE_URI_BY_TENANT[tenant];
  const out = `/tmp/${tenant}_${srcCollection}_fresh.json`;
  execSync(
    `SSHPASS='${VPS_PASSWORD}' sshpass -e ssh -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa ${VPS_HOST} "mongoexport --quiet --uri='${sourceUri}' --collection=${srcCollection} --jsonArray > /tmp/${tenant}_${srcCollection}_fresh.json"`,
    { stdio: 'pipe' }
  );
  execSync(
    `SSHPASS='${VPS_PASSWORD}' sshpass -e scp -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa "${VPS_HOST}:/tmp/${tenant}_${srcCollection}_fresh.json" ${out}`,
    { stdio: 'pipe' }
  );
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

async function archiveAndDelete(db, devColl, archColl, prodIds, label) {
  const dev = await db.collection(devColl).find({ tenantId: TENANT }).toArray();
  const orphans = dev.filter(d => d._legacyId && !prodIds.has(d._legacyId));

  console.log(`\n→ ${label}: dev=${dev.length} | prod=${prodIds.size} | orphans=${orphans.length}`);
  for (const o of orphans.slice(0, 20)) {
    const desc = o.receiptNumber ? `receipt=${o.receiptNumber}` :
                 o.installmentNumber ? `inst#${o.installmentNumber}` :
                 o.firstName ? `${o.firstName} ${o.lastName||''} roll=${o.rollNumber}` :
                 o.accountName ? `${o.accountName}` :
                 '(no descriptor)';
    const amt = o.amountPaid ?? o.installmentAmount ?? o.credit ?? '';
    console.log(`    ${o._legacyId} | ${desc} | amt=${amt}`);
  }

  if (!APPLY || orphans.length === 0) return { archived: 0, deleted: 0, count: orphans.length };

  const stamped = orphans.map(o => ({
    ...o,
    _archivedAt: new Date(),
    _archivedReason: `Orphan: prod has deleted this doc since migration (TENANT=${TENANT}, ${new Date().toISOString().slice(0,10)})`,
    _archivedFromCollection: devColl,
  }));

  const archRes = await db.collection(archColl).insertMany(stamped);
  const ids = orphans.map(o => o._id);
  const delRes = await db.collection(devColl).deleteMany({ _id: { $in: ids } });

  console.log(`  ✓ archived: ${archRes.insertedCount} | deleted: ${delRes.deletedCount}`);
  return { archived: archRes.insertedCount, deleted: delRes.deletedCount, count: orphans.length };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log('=================================================');
  console.log(`Archive + delete orphans  TENANT=${TENANT}  mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log('=================================================');

  const oid = v => v?.$oid || v?.toString?.() || v;

  // Pull fresh prod dumps for the 4 collections
  console.log('\n1. Pulling fresh prod dumps...');
  const prodStudents = pullProd(TENANT, 'students');
  const prodFp = pullProd(TENANT, 'coursefees');
  const prodFi = pullProd(TENANT, 'paymentinstallmenttimes');
  const prodDB = pullProd(TENANT, 'daybookdatas');
  console.log(`   students=${prodStudents.length} fees=${prodFp.length} installments=${prodFi.length} daybook=${prodDB.length}`);

  const stuIds = new Set(prodStudents.map(p => oid(p._id)));
  const fpIds = new Set(prodFp.map(p => oid(p._id)));
  const fiIds = new Set(prodFi.map(p => oid(p._id)));
  const dbIds = new Set(prodDB.map(p => oid(p._id)));

  console.log('\n2. Archiving orphans (in dependency order: daybook → installments → fees → students)');
  const r1 = await archiveAndDelete(db, 'daybookentries',  'daybookentries_orphan_archive',  dbIds, 'daybookentries');
  const r2 = await archiveAndDelete(db, 'feeinstallments', 'feeinstallments_orphan_archive', fiIds, 'feeinstallments');
  const r3 = await archiveAndDelete(db, 'feepayments',     'feepayments_orphan_archive',     fpIds, 'feepayments');
  const r4 = await archiveAndDelete(db, 'students',        'students_orphan_archive',        stuIds, 'students');

  if (APPLY) {
    console.log('\n--- VERIFY (counts after archive) ---');
    for (const [coll, prodCount] of [
      ['daybookentries', prodDB.length],
      ['feeinstallments', prodFi.length],
      ['feepayments', prodFp.length],
      ['students', prodStudents.length],
    ]) {
      const dev = await db.collection(coll).countDocuments({ tenantId: TENANT });
      const devLegacy = await db.collection(coll).countDocuments({ tenantId: TENANT, _legacyId: { $exists: true } });
      const remainingOrphan = devLegacy - prodCount;
      const flag = remainingOrphan === 0 ? '✓' : '⚠ ' + remainingOrphan + ' orphans remain';
      console.log(`  ${coll.padEnd(20)} dev=${dev} (legacy=${devLegacy}) prod=${prodCount}  ${flag}`);
    }
  } else {
    console.log('\n[DRY-RUN] Set APPLY=true to execute.');
    console.log('Total orphans found:', r1.count + r2.count + r3.count + r4.count);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
