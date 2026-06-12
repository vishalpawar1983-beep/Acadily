/**
 * Migrate ALL legacy data from VPS MongoDB to Atlas staging.
 * READ-ONLY on VPS. Writes to flex_academy_staging.
 *
 * Usage: npx tsx scripts/migrate-from-vps.ts [--dry-run]
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");

interface LegacyDb {
  tenantId: string;
  name: string;
  uri: string;
}

const LEGACY_DBS: LegacyDb[] = [
  {
    tenantId: "ims_reliance",
    name: "SchoolsStore",
    uri: "mongodb://imsapp:ims12345@127.0.0.1:27018/SchoolsStore?authSource=SchoolsStore",
  },
  {
    tenantId: "chanakya",
    name: "Chanakya",
    uri: "mongodb://chanakyaapp:chanakya12345@127.0.0.1:27018/Chanakya?authSource=Chanakya",
  },
  {
    tenantId: "webliquid",
    name: "webliquidStudio",
    uri: "mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27018/webliquidStudio?authSource=admin",
  },
];

interface MigrationMapping {
  legacyCollection: string;
  targetCollection: string;
  transform?: (doc: any, tenantId: string) => any;
  skip?: boolean;
}

// Transform helpers
function addTenantId(doc: any, tenantId: string) {
  const { _id, __v, ...rest } = doc;
  return { _id, tenantId, ...rest };
}

const MAPPINGS: MigrationMapping[] = [
  // Already migrated (core)
  // { legacyCollection: "users", targetCollection: "users" },
  // { legacyCollection: "students", targetCollection: "students" },
  // { legacyCollection: "courses", targetCollection: "courses" },
  // { legacyCollection: "coursefees", targetCollection: "feepayments" },

  // NEW - not yet migrated
  {
    legacyCollection: "batches",
    targetCollection: "batches",
    transform: (doc, tenantId) => {
      const { _id, __v, ...rest } = doc;
      return { _id, tenantId, ...rest };
    },
  },
  {
    legacyCollection: "subjects",
    targetCollection: "subjects",
    transform: addTenantId,
  },
  {
    legacyCollection: "trainers",
    targetCollection: "teachers",
    transform: addTenantId,
  },
  {
    legacyCollection: "approvalreciepts",
    targetCollection: "approvals",
    transform: (doc, tenantId) => {
      const { _id, __v, ...rest } = doc;
      return { _id, tenantId, ...rest };
    },
  },
  {
    legacyCollection: "paymentinstallmenttimes",
    targetCollection: "feeinstallments",
    transform: addTenantId,
  },
  {
    legacyCollection: "daybookdatas",
    targetCollection: "daybookentries",
    transform: addTenantId,
  },
  {
    legacyCollection: "daybookaccounts",
    targetCollection: "daybookaccounts",
    transform: addTenantId,
  },
  {
    legacyCollection: "student-issues",
    targetCollection: "studentissues",
    transform: addTenantId,
  },
  {
    legacyCollection: "student-notes",
    targetCollection: "studentnotes",
    transform: addTenantId,
  },
  {
    legacyCollection: "studentsubjectmarks",
    targetCollection: "studentmarks",
    transform: addTenantId,
  },
  {
    legacyCollection: "studentcomissions",
    targetCollection: "commissions",
    transform: addTenantId,
  },
  {
    legacyCollection: "userroleaccesses",
    targetCollection: "roleaccesses",
    transform: addTenantId,
  },
  {
    legacyCollection: "paymentoptions",
    targetCollection: "paymentoptions",
    transform: addTenantId,
  },
  {
    legacyCollection: "timings",
    targetCollection: "timings",
    transform: addTenantId,
  },
  {
    legacyCollection: "companies",
    targetCollection: "companies",
    transform: addTenantId,
  },
  {
    legacyCollection: "forms",
    targetCollection: "formdefinitions",
    transform: addTenantId,
  },
  {
    legacyCollection: "fields",
    targetCollection: "formfields",
    transform: addTenantId,
  },
  {
    legacyCollection: "formfieldvalues",
    targetCollection: "formsubmissions",
    transform: addTenantId,
  },
  {
    legacyCollection: "emailtemplates",
    targetCollection: "emailtemplates",
    transform: addTenantId,
  },
  {
    legacyCollection: "emailremainders",
    targetCollection: "emailreminders",
    transform: addTenantId,
  },
  {
    legacyCollection: "counters",
    targetCollection: "receiptcounters",
    transform: addTenantId,
  },
  {
    legacyCollection: "emaillogs",
    targetCollection: "emaillogs",
    transform: addTenantId,
  },
  {
    legacyCollection: "showstudentdashboards",
    targetCollection: "showstudentdashboards",
    transform: addTenantId,
  },
  {
    legacyCollection: "alertstudentpendingfees",
    targetCollection: "alertstudentpendingfees",
    transform: addTenantId,
  },
  {
    legacyCollection: "categories",
    targetCollection: "categories",
    transform: addTenantId,
  },
  {
    legacyCollection: "coursetypes",
    targetCollection: "coursetypes",
    transform: addTenantId,
  },
  {
    legacyCollection: "selects",
    targetCollection: "selects",
    transform: addTenantId,
  },
  {
    legacyCollection: "numberofyears",
    targetCollection: "numberofyears",
    transform: addTenantId,
  },
  {
    legacyCollection: "labs",
    targetCollection: "labs",
    transform: addTenantId,
  },
  // Settings singletons → migrate raw, consolidate later if needed
  {
    legacyCollection: "emailsuggestions",
    targetCollection: "emailsuggestions",
    transform: addTenantId,
  },
  {
    legacyCollection: "welcomeemails",
    targetCollection: "welcomeemails",
    transform: addTenantId,
  },
  {
    legacyCollection: "whatsappmessagesuggestions",
    targetCollection: "whatsappmessagesuggestions",
    transform: addTenantId,
  },
  {
    legacyCollection: "studentgst_guggestions",
    targetCollection: "studentgst_guggestions",
    transform: addTenantId,
  },
  {
    legacyCollection: "latefees",
    targetCollection: "latefees",
    transform: addTenantId,
  },
  {
    legacyCollection: "remainder-dates",
    targetCollection: "remainderdates",
    transform: addTenantId,
  },
  {
    legacyCollection: "attedences",
    targetCollection: "attendances",
    transform: addTenantId,
  },
];

async function main() {
  const stagingUri = (process.env.MONGO_URI || "").replace(/\/flex_academy_dev\?/, "/flex_academy_staging?");

  // Connect to staging (target)
  const targetConn = await mongoose.createConnection(stagingUri).asPromise();
  const targetDb = targetConn.db!;
  console.log("Connected to staging (target)");

  if (DRY_RUN) console.log("\n*** DRY RUN — no writes ***\n");

  const report: string[] = [];
  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const legacy of LEGACY_DBS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${legacy.name} → tenant: ${legacy.tenantId}`);
    console.log("=".repeat(60));

    let sourceConn: mongoose.Connection;
    try {
      sourceConn = await mongoose.createConnection(legacy.uri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      }).asPromise();
    } catch (err: any) {
      console.error(`  FAILED to connect to ${legacy.name}: ${err.message}`);
      report.push(`${legacy.name}: CONNECTION FAILED`);
      continue;
    }
    const sourceDb = sourceConn.db!;
    console.log(`  Connected to ${legacy.name}`);

    for (const mapping of MAPPINGS) {
      const { legacyCollection, targetCollection, transform } = mapping;

      try {
        const sourceDocs = await sourceDb.collection(legacyCollection).find({}).toArray();

        if (sourceDocs.length === 0) {
          continue; // Skip empty collections silently
        }

        // Check if already migrated (by tenantId + count)
        const existingCount = await targetDb.collection(targetCollection).countDocuments({ tenantId: legacy.tenantId });
        if (existingCount >= sourceDocs.length) {
          console.log(`  ${legacyCollection} → ${targetCollection}: ${sourceDocs.length} docs (ALREADY EXISTS: ${existingCount})`);
          totalSkipped += sourceDocs.length;
          continue;
        }

        // If partial migration exists, clean and re-migrate
        if (existingCount > 0) {
          if (DRY_RUN) {
            console.log(`  ${legacyCollection} → ${targetCollection}: ${sourceDocs.length} docs (WOULD REPLACE ${existingCount} existing)`);
            continue;
          }
          await targetDb.collection(targetCollection).deleteMany({ tenantId: legacy.tenantId });
          console.log(`  Cleaned ${existingCount} partial docs from ${targetCollection}`);
        }

        const transformed = sourceDocs.map(doc =>
          transform ? transform(doc, legacy.tenantId) : addTenantId(doc, legacy.tenantId)
        );

        if (DRY_RUN) {
          console.log(`  ${legacyCollection} → ${targetCollection}: ${sourceDocs.length} docs (DRY RUN)`);
        } else {
          await targetDb.collection(targetCollection).insertMany(transformed, { ordered: false });
          console.log(`  ${legacyCollection} → ${targetCollection}: ${sourceDocs.length} docs ✓`);
        }

        totalMigrated += sourceDocs.length;
        report.push(`${legacy.tenantId}/${legacyCollection} → ${targetCollection}: ${sourceDocs.length}`);
      } catch (err: any) {
        if (err.code === 11000) {
          // Duplicate key - already exists
          console.log(`  ${legacyCollection} → ${targetCollection}: DUPLICATE KEY (already migrated)`);
        } else {
          console.error(`  ${legacyCollection} → ${targetCollection}: ERROR: ${err.message}`);
          report.push(`${legacy.tenantId}/${legacyCollection}: ERROR ${err.message}`);
        }
      }
    }

    await sourceConn.close();
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("MIGRATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total migrated: ${totalMigrated} docs`);
  console.log(`Total skipped (already exist): ${totalSkipped} docs`);
  console.log(`\nDetailed report:`);
  report.forEach(r => console.log(`  ${r}`));

  await targetConn.close();
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
