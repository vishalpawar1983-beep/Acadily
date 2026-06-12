import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const baseUri = process.env.MONGO_URI || "";

  // Staging DB
  const stagingUri = baseUri.replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  await mongoose.connect(stagingUri);
  const sdb = mongoose.connection.db!;
  const sCols = await sdb.listCollections().toArray();
  const stagingNames = sCols.map(c => c.name).sort();
  await mongoose.disconnect();

  // Dev DB (has legacy migrated data)
  await mongoose.connect(baseUri);
  const ddb = mongoose.connection.db!;
  const dCols = await ddb.listCollections().toArray();
  const devNames = dCols.map(c => c.name).sort();
  await mongoose.disconnect();

  console.log("=== DEV (legacy migrated) ===");
  console.log(devNames.join(", "));
  console.log("\n=== STAGING (new portal) ===");
  console.log(stagingNames.join(", "));

  const devSet = new Set(devNames);
  const stagingSet = new Set(stagingNames);

  console.log("\n=== In staging but NOT in dev (new modules) ===");
  const newInStaging = stagingNames.filter(n => devSet.has(n) === false);
  console.log(newInStaging.join(", ") || "(none)");

  console.log("\n=== In dev but NOT in staging (missing from portal) ===");
  const missingFromStaging = devNames.filter(n => stagingSet.has(n) === false);
  console.log(missingFromStaging.join(", ") || "(none)");
}

main().catch(console.error);
