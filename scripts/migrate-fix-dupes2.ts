/**
 * Fix collections with unique index conflicts.
 * Drop the problematic indexes, re-insert legacy data, then optionally recreate indexes.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

interface FixItem {
  tenant: string;
  legacyCol: string;
  targetCol: string;
  sourceUri: string;
  indexesToDrop?: string[]; // index names to drop before insert
}

const FIXES: FixItem[] = [
  // teachers - unique index on tenantId+email, but legacy trainers don't have email
  { tenant: "ims_reliance", legacyCol: "trainers", targetCol: "teachers",
    sourceUri: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore",
    indexesToDrop: ["tenantId_1_email_1"] },

  // feeinstallments - unique index on tenantId+studentId+courseId+installmentNumber, legacy doesn't have these fields
  { tenant: "ims_reliance", legacyCol: "paymentinstallmenttimes", targetCol: "feeinstallments",
    sourceUri: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore",
    indexesToDrop: ["tenantId_1_studentId_1_courseId_1_installmentNumber_1"] },
  { tenant: "chanakya", legacyCol: "paymentinstallmenttimes", targetCol: "feeinstallments",
    sourceUri: "mongodb://chanakyaapp:chanakya12345@127.0.0.1:27018/Chanakya?authSource=Chanakya",
    indexesToDrop: ["tenantId_1_studentId_1_courseId_1_installmentNumber_1"] },
  { tenant: "webliquid", legacyCol: "paymentinstallmenttimes", targetCol: "feeinstallments",
    sourceUri: "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin",
    indexesToDrop: ["tenantId_1_studentId_1_courseId_1_installmentNumber_1"] },

  // daybookaccounts - unique index on tenantId+accountName, legacy has duplicates
  { tenant: "ims_reliance", legacyCol: "daybookaccounts", targetCol: "daybookaccounts",
    sourceUri: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore",
    indexesToDrop: ["tenantId_1_accountName_1"] },

  // studentmarks - unique index on tenantId+studentId+courseId, legacy doesn't have these fields
  { tenant: "ims_reliance", legacyCol: "studentsubjectmarks", targetCol: "studentmarks",
    sourceUri: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore",
    indexesToDrop: ["tenantId_1_studentId_1_courseId_1"] },

  // receiptcounters - _id collision with "rollNumber" string ID
  { tenant: "chanakya", legacyCol: "counters", targetCol: "receiptcounters",
    sourceUri: "mongodb://chanakyaapp:chanakya12345@127.0.0.1:27018/Chanakya?authSource=Chanakya" },
  { tenant: "webliquid", legacyCol: "counters", targetCol: "receiptcounters",
    sourceUri: "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin" },
];

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;

  // Track which indexes we already dropped (only need to drop once per collection)
  const droppedIndexes = new Set<string>();

  for (const fix of FIXES) {
    console.log(`\nProcessing: ${fix.tenant}/${fix.legacyCol} → ${fix.targetCol}`);

    // Drop indexes if needed (once per collection)
    if (fix.indexesToDrop) {
      for (const idx of fix.indexesToDrop) {
        const key = `${fix.targetCol}:${idx}`;
        if (droppedIndexes.has(key)) continue;
        try {
          await targetDb.collection(fix.targetCol).dropIndex(idx);
          console.log(`  Dropped index: ${idx}`);
          droppedIndexes.add(key);
        } catch (err: any) {
          if (err.code === 27) {
            console.log(`  Index ${idx} doesn't exist, skip`);
          } else {
            console.log(`  Drop index error: ${err.message}`);
          }
          droppedIndexes.add(key);
        }
      }
    }

    // Clean existing data for this tenant
    const deleted = await targetDb.collection(fix.targetCol).deleteMany({ tenantId: fix.tenant });
    if (deleted.deletedCount > 0) {
      console.log(`  Cleaned ${deleted.deletedCount} existing docs`);
    }

    // Read from source
    const sourceConn = await mongoose.createConnection(fix.sourceUri, { connectTimeoutMS: 10000 }).asPromise();
    const sourceDb = sourceConn.db!;
    const sourceDocs = await sourceDb.collection(fix.legacyCol).find({}).toArray();
    await sourceConn.close();

    if (sourceDocs.length === 0) {
      console.log(`  Empty source, skip`);
      continue;
    }

    // Transform and insert
    const transformed = sourceDocs.map(doc => {
      const { _id, __v, ...rest } = doc;
      return { _id, tenantId: fix.tenant, ...rest };
    });

    try {
      const result = await targetDb.collection(fix.targetCol).insertMany(transformed, { ordered: false });
      console.log(`  Inserted ${result.insertedCount} of ${sourceDocs.length} docs ✓`);
    } catch (err: any) {
      if (err.insertedCount !== undefined) {
        console.log(`  Inserted ${err.insertedCount} of ${sourceDocs.length} (some dupes skipped)`);
      } else {
        console.error(`  ERROR: ${err.message}`);
      }
    }
  }

  // List remaining indexes on affected collections for verification
  console.log("\n=== Current indexes ===");
  const affectedCols = [...new Set(FIXES.map(f => f.targetCol))];
  for (const col of affectedCols) {
    const indexes = await targetDb.collection(col).indexes();
    console.log(`${col}:`);
    for (const idx of indexes) {
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? " UNIQUE" : ""}`);
    }
  }

  await targetConn.close();
  console.log("\nDone");
}

main().catch(console.error);
