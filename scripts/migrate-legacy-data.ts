/**
 * Legacy Data Migration Script
 *
 * Migrates data from 3 legacy IMS databases + 1 Salon database
 * into a single multi-tenant database with tenantId discriminator.
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-data.ts --source <legacy-uri> --target <new-uri> --tenant <tenant-id> --dry-run
 *
 * Phases:
 *   1. Connect to source and target databases
 *   2. Migrate Company -> Tenant (if not seeded)
 *   3. Migrate Users (add tenantId, map roles)
 *   4. Migrate Students (admission_form -> Student entity)
 *   5. Migrate Courses + Subjects
 *   6. Migrate Fee Payments
 *   7. Migrate Attendance records
 *   8. Print summary report
 */

import mongoose from 'mongoose';

interface MigrationStats {
  users: { total: number; migrated: number; skipped: number; errors: number };
  students: { total: number; migrated: number; skipped: number; errors: number };
  courses: { total: number; migrated: number; skipped: number; errors: number };
  fees: { total: number; migrated: number; skipped: number; errors: number };
  attendance: { total: number; migrated: number; skipped: number; errors: number };
}

function parseArgs(): { sourceUri: string; targetUri: string; tenantId: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const idx = args.indexOf(flag);
    if (idx === -1 || idx + 1 >= args.length) throw new Error(`Missing required flag: ${flag}`);
    return args[idx + 1];
  };

  return {
    sourceUri: get('--source'),
    targetUri: get('--target'),
    tenantId: get('--tenant'),
    dryRun: args.includes('--dry-run'),
  };
}

async function migrateUsers(
  sourceDb: mongoose.Connection,
  targetDb: mongoose.Connection,
  tenantId: string,
  dryRun: boolean,
): Promise<MigrationStats['users']> {
  const stats = { total: 0, migrated: 0, skipped: 0, errors: 0 };

  const sourceUsers = await sourceDb.collection('users').find({}).toArray();
  stats.total = sourceUsers.length;

  for (const legacy of sourceUsers) {
    try {
      // Check if user already migrated
      const existing = await targetDb
        .collection('users')
        .findOne({ tenantId, email: legacy.email?.toLowerCase() });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const mapped = {
        tenantId,
        email: (legacy.email || '').toLowerCase().trim(),
        passwordHash: legacy.password || '',
        firstName: legacy.fName || '',
        lastName: legacy.lName || '',
        phone: legacy.phone,
        role: mapRole(legacy.role),
        isActive: true,
        createdAt: legacy.createdAt || new Date(),
        updatedAt: legacy.updatedAt || new Date(),
        _legacyId: legacy._id.toString(),
      };

      if (!dryRun) {
        await targetDb.collection('users').insertOne(mapped);
      }
      stats.migrated++;
    } catch (err) {
      stats.errors++;
      console.error(`  User migration error (${legacy.email}):`, (err as Error).message);
    }
  }

  return stats;
}

async function migrateStudents(
  sourceDb: mongoose.Connection,
  targetDb: mongoose.Connection,
  tenantId: string,
  dryRun: boolean,
): Promise<MigrationStats['students']> {
  const stats = { total: 0, migrated: 0, skipped: 0, errors: 0 };

  const sourceStudents = await sourceDb.collection('addmission_forms').find({}).toArray();
  stats.total = sourceStudents.length;

  for (const legacy of sourceStudents) {
    try {
      const existing = await targetDb
        .collection('students')
        .findOne({ tenantId, rollNumber: String(legacy.rollNumber) });

      if (existing) {
        stats.skipped++;
        continue;
      }

      // Split name into first/last
      const nameParts = (legacy.name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const mapped = {
        tenantId,
        rollNumber: String(legacy.rollNumber || ''),
        firstName,
        lastName,
        fatherName: legacy.father_name,
        contact: {
          mobile: legacy.mobile_number || '',
          phone: legacy.phone_number,
          email: legacy.email,
          address: legacy.present_address,
          city: legacy.city,
        },
        dateOfBirth: legacy.date_of_birth,
        educationQualification: legacy.education_qualification,
        enrollment: {
          courseId: legacy.courseName?.toString() || '',
          courseName: legacy.select_course || '',
          courseFees: parseFloat(legacy.course_fees) || 0,
          discount: legacy.discount || 0,
          netFees: legacy.netCourseFees || 0,
          remainingFees: legacy.remainingCourseFees || 0,
          totalPaid: legacy.totalPaid || 0,
          downPayment: parseFloat(legacy.down_payment) || 0,
          dateOfJoining: legacy.date_of_joining,
          installmentCount: legacy.no_of_installments || 0,
          installmentAmount: legacy.no_of_installments_amount || 0,
        },
        status: legacy.dropOutStudent ? 'dropout' : (legacy.student_status || 'active'),
        image: legacy.image,
        notes: legacy.message,
        createdAt: legacy.createdAt || new Date(),
        updatedAt: legacy.updatedAt || new Date(),
        _legacyId: legacy._id.toString(),
      };

      if (!dryRun) {
        await targetDb.collection('students').insertOne(mapped);
      }
      stats.migrated++;
    } catch (err) {
      stats.errors++;
      console.error(`  Student migration error (roll: ${legacy.rollNumber}):`, (err as Error).message);
    }
  }

  return stats;
}

async function migrateCourses(
  sourceDb: mongoose.Connection,
  targetDb: mongoose.Connection,
  tenantId: string,
  dryRun: boolean,
): Promise<MigrationStats['courses']> {
  const stats = { total: 0, migrated: 0, skipped: 0, errors: 0 };

  const sourceCourses = await sourceDb.collection('courses').find({}).toArray();
  stats.total = sourceCourses.length;

  // Pre-fetch lookup tables
  const courseTypes = await sourceDb.collection('coursetypes').find({}).toArray();
  const categories = await sourceDb.collection('categories').find({}).toArray();
  const numberOfYears = await sourceDb.collection('numberofyears').find({}).toArray();

  const courseTypeMap = new Map(courseTypes.map((ct) => [ct._id.toString(), ct.courseType || ct.name || '']));
  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c.category || '']));
  const yearsMap = new Map(numberOfYears.map((y) => [y._id.toString(), y.numberOfYears || y.years || 1]));

  // Pre-fetch subjects for all courses
  const subjects = await sourceDb.collection('subjects').find({}).toArray();
  const subjectsByCourse = new Map<string, typeof subjects>();
  for (const sub of subjects) {
    const courseId = sub.course?.toString() || '';
    if (!subjectsByCourse.has(courseId)) subjectsByCourse.set(courseId, []);
    subjectsByCourse.get(courseId)!.push(sub);
  }

  for (const legacy of sourceCourses) {
    try {
      const existing = await targetDb
        .collection('courses')
        .findOne({ tenantId, name: legacy.courseName });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const courseSubjects = subjectsByCourse.get(legacy._id.toString()) || [];

      const mapped = {
        tenantId,
        name: legacy.courseName || '',
        fees: legacy.courseFees || 0,
        courseType: courseTypeMap.get(legacy.courseType?.toString()) || 'Unknown',
        durationYears: yearsMap.get(legacy.numberOfYears?.toString()) || 1,
        category: categoryMap.get(legacy.category?.toString()) || 'General',
        subjects: courseSubjects.map((s) => ({
          name: s.subjectName || '',
          code: s.subjectCode || '',
          fullMarks: s.fullMarks || 100,
          passMarks: s.passMarks || 33,
          semester: parseInt(s.semYear) || 1,
        })),
        isActive: true,
        createdBy: legacy.createdBy || 'migration',
        createdAt: legacy.createdAt || new Date(),
        updatedAt: legacy.updatedAt || new Date(),
        _legacyId: legacy._id.toString(),
      };

      if (!dryRun) {
        await targetDb.collection('courses').insertOne(mapped);
      }
      stats.migrated++;
    } catch (err) {
      stats.errors++;
      console.error(`  Course migration error (${legacy.courseName}):`, (err as Error).message);
    }
  }

  return stats;
}

async function migrateFees(
  sourceDb: mongoose.Connection,
  targetDb: mongoose.Connection,
  tenantId: string,
  dryRun: boolean,
): Promise<MigrationStats['fees']> {
  const stats = { total: 0, migrated: 0, skipped: 0, errors: 0 };

  const sourceFees = await sourceDb.collection('coursefees').find({}).toArray();
  stats.total = sourceFees.length;

  // Pre-fetch payment options
  const paymentOptions = await sourceDb.collection('paymentoptions').find({}).toArray();
  const paymentMap = new Map(paymentOptions.map((p) => [p._id.toString(), p.name || 'cash']));

  for (const legacy of sourceFees) {
    try {
      const existing = await targetDb
        .collection('feepayments')
        .findOne({ tenantId, receiptNumber: legacy.reciptNumber });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const mapped = {
        tenantId,
        studentId: legacy.studentInfo?.toString() || '',
        courseId: legacy.courseName?.toString() || '',
        netCourseFees: legacy.netCourseFees || 0,
        remainingFees: legacy.remainingFees || 0,
        amountPaid: legacy.amountPaid || 0,
        receiptNumber: legacy.reciptNumber || '',
        paymentMethod: paymentMap.get(legacy.paymentOption?.toString()) || 'cash',
        narration: legacy.narration,
        lateFees: legacy.lateFees || 0,
        gstPercentage: legacy.gst_percentage || 0,
        addedBy: legacy.addedBy || 'migration',
        paymentDate: legacy.amountDate ? new Date(legacy.amountDate) : (legacy.createdAt || new Date()),
        createdAt: legacy.createdAt || new Date(),
        updatedAt: legacy.updatedAt || new Date(),
        _legacyId: legacy._id.toString(),
      };

      if (!dryRun) {
        await targetDb.collection('feepayments').insertOne(mapped);
      }
      stats.migrated++;
    } catch (err) {
      stats.errors++;
      console.error(`  Fee migration error (${legacy.reciptNumber}):`, (err as Error).message);
    }
  }

  return stats;
}

async function migrateAttendance(
  sourceDb: mongoose.Connection,
  targetDb: mongoose.Connection,
  tenantId: string,
  dryRun: boolean,
): Promise<MigrationStats['attendance']> {
  const stats = { total: 0, migrated: 0, skipped: 0, errors: 0 };

  const sourceAttendance = await sourceDb.collection('attendences').find({}).toArray();
  stats.total = sourceAttendance.length;

  for (const legacy of sourceAttendance) {
    try {
      const existing = await targetDb.collection('attendances').findOne({
        tenantId,
        batchId: legacy.batch?.toString(),
        month: legacy.month,
        year: legacy.year,
      });

      if (existing) {
        stats.skipped++;
        continue;
      }

      const records = (legacy.students || []).map((s: any) => ({
        studentId: s.student?.toString() || '',
        days: s.days instanceof Map ? Object.fromEntries(s.days) : (s.days || {}),
      }));

      const mapped = {
        tenantId,
        batchId: legacy.batch?.toString() || '',
        month: legacy.month,
        year: legacy.year,
        records,
        createdAt: legacy.createdAt || new Date(),
        updatedAt: legacy.updatedAt || new Date(),
        _legacyId: legacy._id.toString(),
      };

      if (!dryRun) {
        await targetDb.collection('attendances').insertOne(mapped);
      }
      stats.migrated++;
    } catch (err) {
      stats.errors++;
      console.error(`  Attendance migration error:`, (err as Error).message);
    }
  }

  return stats;
}

function mapRole(legacyRole?: string): string {
  const roleMap: Record<string, string> = {
    SuperAdmin: 'SuperAdmin',
    Admin: 'Admin',
    Accounts: 'Admin',
    Counsellor: 'Counsellor',
    Telecaller: 'Counsellor',
    Student: 'Student',
  };
  return roleMap[legacyRole || ''] || 'Student';
}

async function main() {
  const { sourceUri, targetUri, tenantId, dryRun } = parseArgs();

  console.log('='.repeat(60));
  console.log('  Flex Academy - Legacy Data Migration');
  console.log('='.repeat(60));
  console.log(`  Source:   ${sourceUri.replace(/\/\/.*@/, '//<redacted>@')}`);
  console.log(`  Target:   ${targetUri.replace(/\/\/.*@/, '//<redacted>@')}`);
  console.log(`  Tenant:   ${tenantId}`);
  console.log(`  Dry Run:  ${dryRun}`);
  console.log('='.repeat(60));

  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  const targetConn = await mongoose.createConnection(targetUri).asPromise();

  console.log('\nConnected to both databases.\n');

  const stats: MigrationStats = {
    users: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    students: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    courses: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    fees: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    attendance: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  };

  console.log('[1/5] Migrating Users...');
  stats.users = await migrateUsers(sourceConn, targetConn, tenantId, dryRun);
  console.log(`  Done: ${stats.users.migrated} migrated, ${stats.users.skipped} skipped, ${stats.users.errors} errors\n`);

  console.log('[2/5] Migrating Students...');
  stats.students = await migrateStudents(sourceConn, targetConn, tenantId, dryRun);
  console.log(`  Done: ${stats.students.migrated} migrated, ${stats.students.skipped} skipped, ${stats.students.errors} errors\n`);

  console.log('[3/5] Migrating Courses + Subjects...');
  stats.courses = await migrateCourses(sourceConn, targetConn, tenantId, dryRun);
  console.log(`  Done: ${stats.courses.migrated} migrated, ${stats.courses.skipped} skipped, ${stats.courses.errors} errors\n`);

  console.log('[4/5] Migrating Fee Payments...');
  stats.fees = await migrateFees(sourceConn, targetConn, tenantId, dryRun);
  console.log(`  Done: ${stats.fees.migrated} migrated, ${stats.fees.skipped} skipped, ${stats.fees.errors} errors\n`);

  console.log('[5/5] Migrating Attendance...');
  stats.attendance = await migrateAttendance(sourceConn, targetConn, tenantId, dryRun);
  console.log(`  Done: ${stats.attendance.migrated} migrated, ${stats.attendance.skipped} skipped, ${stats.attendance.errors} errors\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('  MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`  ${'Collection'.padEnd(15)} ${'Total'.padEnd(8)} ${'Migrated'.padEnd(10)} ${'Skipped'.padEnd(9)} Errors`);
  console.log('-'.repeat(60));
  for (const [name, s] of Object.entries(stats)) {
    console.log(`  ${name.padEnd(15)} ${String(s.total).padEnd(8)} ${String(s.migrated).padEnd(10)} ${String(s.skipped).padEnd(9)} ${s.errors}`);
  }
  const totalMigrated = Object.values(stats).reduce((sum, s) => sum + s.migrated, 0);
  const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);
  console.log('-'.repeat(60));
  console.log(`  Total migrated: ${totalMigrated} | Total errors: ${totalErrors}`);
  if (dryRun) console.log('\n  ** DRY RUN - No data was written **');
  console.log('='.repeat(60));

  await sourceConn.close();
  await targetConn.close();
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
