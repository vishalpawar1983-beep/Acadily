import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const uri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const cols = await db.listCollections().toArray();
  const skip = new Set(["tenants", "users"]);

  for (const col of cols) {
    if (skip.has(col.name)) continue;
    const result = await db.collection(col.name).deleteMany({ tenantId: "e2e_test" });
    if (result.deletedCount > 0) {
      console.log(`Cleaned ${col.name}: ${result.deletedCount}`);
    }
  }

  console.log("Cleanup done");
  await mongoose.disconnect();
}

main().catch(console.error);
