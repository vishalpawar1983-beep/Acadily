import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function main() {
  const uri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  if (uri === "") { console.log("No MONGO_URI"); process.exit(1); }
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const tenant = await db.collection("tenants").findOne({ tenantId: "e2e_test" });
  const user = await db.collection("users").findOne({ tenantId: "e2e_test" });
  console.log("Tenant exists:", tenant !== null);
  console.log("User exists:", user !== null);

  if (tenant === null) {
    await db.collection("tenants").insertOne({
      tenantId: "e2e_test",
      name: "E2E Test Tenant",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created tenant");
  }

  if (user === null) {
    const hash = await bcrypt.hash("TestPass@123", 10);
    await db.collection("users").insertOne({
      tenantId: "e2e_test",
      name: "E2E Admin",
      email: "admin@e2etest.in",
      password: hash,
      role: "SuperAdmin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created user");
  }

  await mongoose.disconnect();
  console.log("Done");
}

main().catch(console.error);
