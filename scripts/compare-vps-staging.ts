/**
 * Apple-to-apple comparison: VPS legacy vs Atlas staging.
 * READ-ONLY on both. Zero writes anywhere.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

interface DbConfig {
  tenantId: string;
  name: string;
  uri: string;
}

const LEGACY_DBS: DbConfig[] = [
  { tenantId: "ims_reliance", name: "SchoolsStore", uri: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore" },
  { tenantId: "chanakya", name: "Chanakya", uri: "mongodb://chanakyaapp:chanakya12345@127.0.0.1:27018/Chanakya?authSource=Chanakya" },
  { tenantId: "webliquid", name: "webliquidStudio", uri: "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin" },
];

// Legacy collection → staging collection mapping
const COLLECTION_MAP: Record<string, string> = {
  "users": "users",
  "students": "students",
  "courses": "courses",
  "coursefees": "feepayments",
  "subjects": "subjects",
  "batches": "batches",
  "trainers": "teachers",
  "teachers": "teachers",
  "approvalreciepts": "approvals",
  "paymentinstallmenttimes": "feeinstallments",
  "daybookdatas": "daybookentries",
  "daybookaccounts": "daybookaccounts",
  "student-issues": "studentissues",
  "student-notes": "studentnotes",
  "studentsubjectmarks": "studentmarks",
  "studentcomissions": "commissions",
  "userroleaccesses": "roleaccesses",
  "paymentoptions": "paymentoptions",
  "timings": "timings",
  "companies": "companies",
  "forms": "formdefinitions",
  "fields": "formfields",
  "formfieldvalues": "formsubmissions",
  "emailtemplates": "emailtemplates",
  "emailremainders": "emailreminders",
  "counters": "receiptcounters",
  "emaillogs": "emaillogs",
  "showstudentdashboards": "showstudentdashboards",
  "alertstudentpendingfees": "alertstudentpendingfees",
  "categories": "categories",
  "coursetypes": "coursetypes",
  "selects": "selects",
  "numberofyears": "numberofyears",
  "labs": "labs",
  "attedences": "attendances",
  // Settings singletons
  "emailsuggestions": "emailsuggestions",
  "welcomeemails": "welcomeemails",
  "whatsappmessagesuggestions": "whatsappmessagesuggestions",
  "studentgst_guggestions": "studentgst_guggestions",
  "latefees": "latefees",
  "remainder-dates": "remainderdates",
};

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;

  let totalLegacy = 0;
  let totalStaging = 0;
  let mismatches = 0;

  for (const db of LEGACY_DBS) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`${db.name} (tenant: ${db.tenantId})`);
    console.log("=".repeat(70));
    console.log(`${"Legacy Collection".padEnd(30)} ${"VPS".padStart(6)} ${"Staging".padStart(8)} ${"Status".padStart(8)}`);
    console.log("-".repeat(70));

    const sourceConn = await mongoose.createConnection(db.uri, { connectTimeoutMS: 10000 }).asPromise();
    const sourceDb = sourceConn.db!;
    const collections = await sourceDb.listCollections().toArray();

    for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const legacyCount = await sourceDb.collection(col.name).countDocuments();
      if (legacyCount === 0) continue; // skip empty

      const targetCol = COLLECTION_MAP[col.name];
      let stagingCount = 0;
      let status = "";

      if (targetCol) {
        stagingCount = await targetDb.collection(targetCol).countDocuments({ tenantId: db.tenantId });
        if (stagingCount === legacyCount) {
          status = "✓ MATCH";
        } else if (stagingCount > legacyCount) {
          status = "⚠ EXTRA";
          mismatches++;
        } else {
          status = `✗ MISSING ${legacyCount - stagingCount}`;
          mismatches++;
        }
      } else {
        status = "? UNMAPPED";
        mismatches++;
      }

      const line = `${(col.name + " → " + (targetCol || "???")).padEnd(45)} ${String(legacyCount).padStart(6)} ${String(stagingCount).padStart(8)} ${status}`;
      console.log(line);

      totalLegacy += legacyCount;
      totalStaging += stagingCount;
    }

    await sourceConn.close();
  }

  // Also check staging for e2e_test data that shouldn't be there
  console.log(`\n${"=".repeat(70)}`);
  console.log("e2e_test data check (should be 0 in non-test collections)");
  console.log("=".repeat(70));
  const stagingCols = await targetDb.listCollections().toArray();
  for (const col of stagingCols.sort((a, b) => a.name.localeCompare(b.name))) {
    const e2eCount = await targetDb.collection(col.name).countDocuments({ tenantId: "e2e_test" });
    if (e2eCount > 0 && col.name !== "tenants" && col.name !== "users") {
      console.log(`  ⚠ ${col.name}: ${e2eCount} e2e_test docs remaining`);
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total legacy docs (non-zero): ${totalLegacy}`);
  console.log(`Total staging docs (matched): ${totalStaging}`);
  console.log(`Mismatches: ${mismatches}`);

  await targetConn.close();
}

main().catch(console.error);
