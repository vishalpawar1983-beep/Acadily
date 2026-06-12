# 09 - Database Migration Plan

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Current State: 4 Separate Databases

```
MongoDB 127.0.0.1:27017
├── SchoolsStore     (IMS Reliance)     → tenant: ims_reliance
├── Chanakya         (Chanakya's Prep)  → tenant: chanakya
├── webliquidStudio  (Dabims)           → tenant: webliquid
└── Saloon           (Salon Mgmt)       → tenant: salon_main
```

## Target State: 1 Unified Database

```
MongoDB Atlas (Staging) / Local (Prod)
└── flex_academy
    ├── tenants              (NEW - tenant registry)
    ├── users                (MERGED - all tenants, + tenantId)
    ├── students             (MERGED from admission_forms)
    ├── courses              (MERGED)
    ├── subjects             (MERGED)
    ├── batches              (MERGED)
    ├── batch_categories     (MERGED)
    ├── course_fees          (MERGED)
    ├── receipt_fees         (MERGED)
    ├── installments         (MERGED from PaymentInstallmentTimeExpire)
    ├── attendance_records   (MERGED)
    ├── trainers             (MERGED)
    ├── timings              (MERGED)
    ├── labs                 (MERGED)
    ├── day_book_accounts    (MERGED)
    ├── day_book_entries     (MERGED)
    ├── email_reminders      (MERGED)
    ├── email_templates      (MERGED)
    ├── notification_suggestions (MERGED - email, whatsapp, gst, late fees)
    ├── custom_forms         (MERGED)
    ├── custom_form_fields   (MERGED)
    ├── form_submissions     (MERGED)
    ├── approval_requests    (MERGED)
    ├── user_role_access     (MERGED)
    ├── companies            (MERGED - institute profiles)
    ├── teachers             (MERGED)
    ├── student_notes        (MERGED)
    ├── student_issues       (MERGED)
    ├── student_marks        (MERGED)
    ├── student_commissions  (MERGED)
    ├── payment_options      (MERGED)
    ├── alert_student_fees   (MERGED)
    │
    │  ── Salon-specific collections ──
    ├── salon_categories     (FROM Saloon DB)
    ├── salon_services       (FROM Saloon DB)
    ├── salon_customers      (FROM Saloon DB)
    ├── salon_carts          (FROM Saloon DB)
    ├── salon_saved_carts    (FROM Saloon DB)
    ├── salon_payments       (FROM Saloon DB)
    └── salon_appointments   (FROM Saloon DB)
```

## Migration Script Design

```typescript
// scripts/migrate-data.ts

interface MigrationStep {
  name: string;
  sourceDb: string;
  sourceCollection: string;
  targetCollection: string;
  tenantId: string;
  transform?: (doc: any) => any;  // Optional document transformation
}

const migrationSteps: MigrationStep[] = [
  // ── IMS Reliance ──
  {
    name: 'IMS Users',
    sourceDb: 'SchoolsStore',
    sourceCollection: 'users',
    targetCollection: 'users',
    tenantId: 'ims_reliance',
  },
  {
    name: 'IMS Students',
    sourceDb: 'SchoolsStore',
    sourceCollection: 'addmissionforms',  // Mongoose pluralizes
    targetCollection: 'students',
    tenantId: 'ims_reliance',
    transform: (doc) => ({
      ...doc,
      // Fix typo in field name during migration
      admissionDate: doc.addmissionDate || doc.createdAt,
    }),
  },
  // ... repeat for all collections

  // ── Chanakya ──
  {
    name: 'Chanakya Users',
    sourceDb: 'Chanakya',
    sourceCollection: 'users',
    targetCollection: 'users',
    tenantId: 'chanakya',
  },
  // ... repeat for all collections

  // ── WebliquidStudio ──
  // ... same pattern

  // ── Saloon ──
  {
    name: 'Salon Users',
    sourceDb: 'Saloon',
    sourceCollection: 'users',
    targetCollection: 'users',
    tenantId: 'salon_main',
  },
  {
    name: 'Salon Categories',
    sourceDb: 'Saloon',
    sourceCollection: 'categories',
    targetCollection: 'salon_categories',
    tenantId: 'salon_main',
  },
  // ... repeat for salon collections
];
```

## Migration Execution Flow

```
Step 1: PREPARE
  ├── Create Atlas cluster (staging)
  ├── Create tenants collection with 4 tenant records
  ├── Verify source DB connectivity
  └── Take backup of all source DBs (mongodump)

Step 2: DRY RUN
  ├── Run migration script with --dry-run flag
  ├── Log document counts per collection
  ├── Log any transformation errors
  └── Verify no _id collisions across tenants

Step 3: MIGRATE
  ├── For each MigrationStep:
  │   ├── Read all documents from source
  │   ├── Add tenantId to each document
  │   ├── Apply transform function if specified
  │   ├── Insert into target collection
  │   ├── Log: {source_count, target_count, errors}
  │   └── Verify counts match
  └── Total execution: estimated 5-10 minutes

Step 4: INDEX
  ├── Create compound indexes (tenantId + business keys)
  ├── Create unique indexes where needed (tenantId + email)
  └── Verify index usage with explain()

Step 5: VERIFY
  ├── For each tenant:
  │   ├── Query students count == source count
  │   ├── Query courses count == source count
  │   ├── Query users count == source count
  │   ├── Spot-check 10 random documents
  │   └── Verify ObjectId references still valid
  └── Generate verification report

Step 6: CUTOVER
  ├── Point new app to unified DB
  ├── Verify app works for all tenants
  ├── Monitor for 24 hours
  └── Keep legacy DBs for 30 days (rollback safety net)
```

## Data Integrity Checks

```typescript
// Post-migration verification
async function verifyMigration(sourceDb: string, targetDb: string, tenantId: string) {
  const checks = [
    { collection: 'users', sourceCol: 'users' },
    { collection: 'students', sourceCol: 'addmissionforms' },
    { collection: 'courses', sourceCol: 'courses' },
    // ... all collections
  ];

  for (const check of checks) {
    const sourceCount = await sourceDb.collection(check.sourceCol).countDocuments();
    const targetCount = await targetDb.collection(check.collection).countDocuments({ tenantId });

    if (sourceCount !== targetCount) {
      log.error({
        check: check.collection,
        tenantId,
        sourceCount,
        targetCount,
        diff: sourceCount - targetCount,
      }, 'COUNT MISMATCH');
    }
  }
}
```

## Rollback Plan

If migration fails or data corruption detected:

1. Stop new application
2. Legacy apps are still running (never stopped during migration)
3. Drop the unified database on Atlas
4. No data loss — source databases are untouched
5. Investigate, fix script, retry

## Known Data Issues to Fix During Migration

| Issue | Current | Fix During Migration |
|-------|---------|---------------------|
| Typo: `addmission` | Field/collection names | Rename to `admission` |
| Typo: `attendence` | Collection/model name | Rename to `attendance` |
| Typo: `remainder` | Used for "reminder" | Rename to `reminder` |
| Typo: `comission` | Model name | Rename to `commission` |
| Duplicate images | Same image uploaded multiple times | Deduplicate by hash |
| User creation in GET | Orphaned user records | Clean up during migration |
| Missing timestamps | Some old docs lack createdAt | Set to document _id timestamp |

## Collection Name Mapping (Legacy → New)

| Legacy Collection (Mongoose pluralized) | New Collection |
|----------------------------------------|----------------|
| users | users |
| addmissionforms | students |
| courses | courses |
| subjects | subjects |
| batches | batches |
| batchcategories | batch_categories |
| coursefees | course_fees |
| reciptfees | receipt_fees |
| paymentinstallmenttimeexpires | installments |
| attendences | attendance_records |
| trainers | trainers |
| timings | timings |
| labs | labs |
| daybookaccounts | day_book_accounts |
| daybookdatas | day_book_entries |
| emailremainders | email_reminders |
| emailtemplates | email_templates |
| emailsuggestions | notification_suggestions |
| whatsappmessagesuggestions | notification_suggestions |
| studentgstsuggestions | notification_suggestions |
| latefeesuggestions | notification_suggestions |
| customforms | custom_forms |
| formfields | custom_form_fields |
| addforms | form_submissions |
| approvals | approval_requests |
| userroleaccesses | user_role_access |
| companies | companies |
| teachers | teachers |
| studentnotes | student_notes |
| studentissues | student_issues |
| studentsubjectmarks | student_marks |
| studentcomissions | student_commissions |
| paymentoptions | payment_options |
| alertstudentpendingfees | alert_student_fees |
