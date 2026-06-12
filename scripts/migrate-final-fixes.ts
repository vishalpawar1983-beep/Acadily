/**
 * Final fixes for the 4 mismatches.
 * READ-ONLY on VPS (via SSH tunnel on 27018). Writes only to Atlas staging.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;

  // === FIX 1: Counters ===
  // Legacy counters all have _id: "rollNumber" (string).
  // IMS counter is already in staging. Need to insert chanakya & webliquid
  // with different _ids since they'd collide.
  console.log("=== Fixing counters ===");

  // Insert chanakya counter with a generated _id
  const chanakyaExists = await targetDb.collection("receiptcounters").countDocuments({ tenantId: "chanakya" });
  if (chanakyaExists === 0) {
    await targetDb.collection("receiptcounters").insertOne({
      tenantId: "chanakya",
      _legacyId: "rollNumber",
      __v: 0,
      sequence_value: 450,
    });
    console.log("  Inserted chanakya counter (sequence_value: 450)");
  } else {
    console.log("  Chanakya counter already exists");
  }

  const webliquidExists = await targetDb.collection("receiptcounters").countDocuments({ tenantId: "webliquid" });
  if (webliquidExists === 0) {
    await targetDb.collection("receiptcounters").insertOne({
      tenantId: "webliquid",
      _legacyId: "rollNumber",
      __v: 0,
      sequence_value: 3,
    });
    console.log("  Inserted webliquid counter (sequence_value: 3)");
  } else {
    console.log("  Webliquid counter already exists");
  }

  // Also tag the IMS counter with tenantId if missing
  const imsCounter = await targetDb.collection("receiptcounters").findOne({ _id: "rollNumber" as any });
  if (imsCounter && imsCounter.tenantId === undefined) {
    await targetDb.collection("receiptcounters").updateOne(
      { _id: "rollNumber" as any },
      { $set: { tenantId: "ims_reliance" } }
    );
    console.log("  Tagged IMS counter with tenantId");
  }

  // === FIX 2: Missing webliquid user ===
  // 8 users on VPS, 7 in staging. 2 users have no email.
  // Check which one is missing.
  console.log("\n=== Fixing webliquid users ===");
  const sourceConn = await mongoose.createConnection(
    "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin",
    { connectTimeoutMS: 10000 }
  ).asPromise();
  const sourceDb = sourceConn.db!;

  const vpsUsers = await sourceDb.collection("users").find({}).toArray();
  const stagingUsers = await targetDb.collection("users").find({ tenantId: "webliquid" }).toArray();
  const stagingUserIds = new Set(stagingUsers.map(u => u._id.toString()));

  let missingCount = 0;
  for (const user of vpsUsers) {
    if (stagingUserIds.has(user._id.toString()) === false) {
      const { __v, ...rest } = user;
      console.log(`  Missing user: _id=${user._id}, email=${user.email || "(none)"}`);
      await targetDb.collection("users").insertOne({ ...rest, tenantId: "webliquid" });
      console.log(`  Inserted ✓`);
      missingCount++;
    }
  }
  if (missingCount === 0) {
    console.log("  All webliquid users present");
  }

  await sourceConn.close();

  // === Verify ===
  console.log("\n=== Verification ===");
  const chCount = await targetDb.collection("receiptcounters").countDocuments({ tenantId: "chanakya" });
  const wlCount = await targetDb.collection("receiptcounters").countDocuments({ tenantId: "webliquid" });
  const wlUsers = await targetDb.collection("users").countDocuments({ tenantId: "webliquid" });
  console.log(`  chanakya counters: ${chCount} (expected: 1)`);
  console.log(`  webliquid counters: ${wlCount} (expected: 1)`);
  console.log(`  webliquid users: ${wlUsers} (expected: 8)`);

  await targetConn.close();
  console.log("\nDone");
}

main().catch(console.error);
