/**
 * Fix collections that had duplicate key errors during migration.
 * Cleans the target collection for that tenant, then re-inserts.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DUPES = [
  { legacy: "trainers", target: "teachers", db: "SchoolsStore", auth: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore", tenant: "ims_reliance" },
  { legacy: "paymentinstallmenttimes", target: "feeinstallments", db: "SchoolsStore", auth: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore", tenant: "ims_reliance" },
  { legacy: "daybookaccounts", target: "daybookaccounts", db: "SchoolsStore", auth: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore", tenant: "ims_reliance" },
  { legacy: "studentsubjectmarks", target: "studentmarks", db: "SchoolsStore", auth: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore", tenant: "ims_reliance" },
  { legacy: "paymentinstallmenttimes", target: "feeinstallments", db: "Chanakya", auth: "mongodb://chanakyaapp:chanakya12345@127.0.0.1:27018/Chanakya?authSource=Chanakya", tenant: "chanakya" },
  { legacy: "counters", target: "receiptcounters", db: "Chanakya", auth: "mongodb://chanakyaapp:chanakya12345@127.0.0.1:27018/Chanakya?authSource=Chanakya", tenant: "chanakya" },
  { legacy: "paymentinstallmenttimes", target: "feeinstallments", db: "webliquidStudio", auth: "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin", tenant: "webliquid" },
  { legacy: "counters", target: "receiptcounters", db: "webliquidStudio", auth: "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin", tenant: "webliquid" },
];

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;

  for (const d of DUPES) {
    const sourceConn = await mongoose.createConnection(d.auth, {
      connectTimeoutMS: 10000,
    }).asPromise();
    const sourceDb = sourceConn.db!;

    const sourceDocs = await sourceDb.collection(d.legacy).find({}).toArray();
    if (sourceDocs.length === 0) {
      console.log(`${d.tenant}/${d.legacy}: empty, skip`);
      await sourceConn.close();
      continue;
    }

    // Clean target for this tenant
    const deleted = await targetDb.collection(d.target).deleteMany({ tenantId: d.tenant });
    console.log(`${d.tenant}/${d.target}: cleaned ${deleted.deletedCount} existing`);

    // Re-insert with tenantId
    const transformed = sourceDocs.map(doc => {
      const { _id, __v, ...rest } = doc;
      return { _id, tenantId: d.tenant, ...rest };
    });

    try {
      await targetDb.collection(d.target).insertMany(transformed, { ordered: false });
      console.log(`${d.tenant}/${d.legacy} → ${d.target}: ${sourceDocs.length} docs ✓`);
    } catch (err: any) {
      console.error(`${d.tenant}/${d.legacy} → ${d.target}: ERROR ${err.message}`);
    }

    await sourceConn.close();
  }

  await targetConn.close();
  console.log("\nDone fixing duplicates");
}

main().catch(console.error);
