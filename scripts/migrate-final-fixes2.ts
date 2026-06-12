import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;

  // Drop the strict unique index on users (tenantId+email)
  try {
    await targetDb.collection("users").dropIndex("tenantId_1_email_1");
    console.log("Dropped unique index tenantId_1_email_1 on users");
  } catch (err: any) {
    console.log("Index drop:", err.message);
  }

  // Insert the remaining missing webliquid user
  const sourceConn = await mongoose.createConnection(
    "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin",
    { connectTimeoutMS: 10000 }
  ).asPromise();
  const sourceDb = sourceConn.db!;

  const vpsUsers = await sourceDb.collection("users").find({}).toArray();
  const stagingUsers = await targetDb.collection("users").find({ tenantId: "webliquid" }).toArray();
  const stagingUserIds = new Set(stagingUsers.map(u => u._id.toString()));

  for (const user of vpsUsers) {
    if (stagingUserIds.has(user._id.toString()) === false) {
      const { __v, ...rest } = user;
      await targetDb.collection("users").insertOne({ ...rest, tenantId: "webliquid" });
      console.log(`Inserted missing user: ${user._id} (email: ${user.email || "null"})`);
    }
  }

  await sourceConn.close();

  // Recreate a sparse unique index (only enforces uniqueness when email is not null)
  await targetDb.collection("users").createIndex(
    { tenantId: 1, email: 1 },
    { unique: true, sparse: true, name: "tenantId_1_email_1_sparse" }
  );
  console.log("Created sparse unique index on tenantId+email");

  // Final verification
  const wlUsers = await targetDb.collection("users").countDocuments({ tenantId: "webliquid" });
  console.log(`webliquid users: ${wlUsers} (expected: 8)`);

  await targetConn.close();
  console.log("Done");
}

main().catch(console.error);
