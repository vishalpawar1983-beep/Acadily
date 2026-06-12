import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const uri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const cols = await db.listCollections().toArray();
  console.log("=== flex_academy_staging: All Collections ===\n");

  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    const total = await db.collection(c.name).countDocuments();
    const e2e = await db.collection(c.name).countDocuments({ tenantId: "e2e_test" });
    const ims = await db.collection(c.name).countDocuments({ tenantId: "ims_reliance" });
    const chanakya = await db.collection(c.name).countDocuments({ tenantId: "chanakya" });
    const webliquid = await db.collection(c.name).countDocuments({ tenantId: "webliquid" });
    const other = total - e2e - ims - chanakya - webliquid;

    let detail = `total=${total}`;
    if (ims > 0) detail += ` ims=${ims}`;
    if (chanakya > 0) detail += ` chanakya=${chanakya}`;
    if (webliquid > 0) detail += ` webliquid=${webliquid}`;
    if (e2e > 0) detail += ` e2e=${e2e}`;
    if (other > 0) detail += ` other=${other}`;

    console.log(`  ${c.name.padEnd(25)} ${detail}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
