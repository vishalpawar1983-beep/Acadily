import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;

  // Read VPS webliquid users (via SSH tunnel)
  const sourceConn = await mongoose.createConnection(
    "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin",
    { connectTimeoutMS: 10000 }
  ).asPromise();
  const sourceDb = sourceConn.db!;
  const vpsUsers = await sourceDb.collection("users").find({}).toArray();
  await sourceConn.close();

  console.log(`VPS webliquid users: ${vpsUsers.length}`);
  for (const u of vpsUsers) {
    console.log(`  ${u._id} - ${u.email || "(null)"}`);
  }

  // Delete ALL webliquid users from staging, then re-insert from VPS
  const deleted = await targetDb.collection("users").deleteMany({ tenantId: "webliquid" });
  console.log(`\nDeleted ${deleted.deletedCount} webliquid users from staging`);

  const toInsert = vpsUsers.map(doc => {
    const { __v, ...rest } = doc;
    return { ...rest, tenantId: "webliquid" };
  });

  const result = await targetDb.collection("users").insertMany(toInsert, { ordered: false });
  console.log(`Inserted ${result.insertedCount} webliquid users`);

  // Now recreate partial unique index
  try {
    await targetDb.collection("users").createIndex(
      { tenantId: 1, email: 1 },
      { unique: true, partialFilterExpression: { email: { $type: "string" } }, name: "tenantId_1_email_1_partial" }
    );
    console.log("Created partial unique index on users");
  } catch (err: any) {
    console.log("Index creation:", err.message);
  }

  // Verify
  const finalCount = await targetDb.collection("users").countDocuments({ tenantId: "webliquid" });
  console.log(`\nFinal webliquid users: ${finalCount} (expected: ${vpsUsers.length})`);

  await targetConn.close();
  console.log("Done");
}

main().catch(console.error);
