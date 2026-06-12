/**
 * Production Data Migration from BSON Dumps
 *
 * Reads mongodump BSON files from local disk and inserts into Atlas staging
 * with tenantId discriminator. Zero changes to production VPS.
 *
 * Usage:
 *   npx tsx scripts/migrate-from-dumps.ts
 *   npx tsx scripts/migrate-from-dumps.ts --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { BSON } from 'bson';

// ── Configuration ──

// Use --target=staging or --target=dev to pick the database (default: dev, which Render connects to)
const targetDb = process.argv.find(a => a.startsWith('--target='))?.split('=')[1] || 'dev';
const DB_NAME = targetDb === 'staging' ? 'flex_academy_staging' : 'flex_academy_dev';
const ATLAS_URI = `mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster-ims`;

const DUMP_BASE = '/tmp/flex-legacy-dumps/flex-dumps';

const TENANT_MAP: Record<string, { tenantId: string; dumpDir: string }> = {
  ims_reliance: { tenantId: 'ims_reliance', dumpDir: 'SchoolsStore' },
  chanakya:     { tenantId: 'chanakya',     dumpDir: 'Chanakya' },
  webliquid:    { tenantId: 'webliquid',    dumpDir: 'webliquidStudio' },
  salon_main:   { tenantId: 'salon_main',   dumpDir: 'Saloon' },
};

const DRY_RUN = process.argv.includes('--dry-run');

// ── Helpers ──

function readBsonFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const buffer = fs.readFileSync(filePath);
  const docs: any[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    const docSize = buffer.readInt32LE(offset);
    if (docSize <= 0 || offset + docSize > buffer.length) break;
    const docBuffer = buffer.subarray(offset, offset + docSize);
    docs.push(BSON.deserialize(docBuffer));
    offset += docSize;
  }
  return docs;
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

interface Stats {
  collection: string;
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

async function upsertMany(
  db: mongoose.Connection,
  collectionName: string,
  docs: any[],
  uniqueFilter: (doc: any) => Record<string, any>,
): Promise<Stats> {
  const stats: Stats = { collection: collectionName, total: docs.length, migrated: 0, skipped: 0, errors: 0 };
  if (docs.length === 0) return stats;

  const collection = db.collection(collectionName);

  for (const doc of docs) {
    try {
      const filter = uniqueFilter(doc);
      const existing = await collection.findOne(filter);
      if (existing) {
        stats.skipped++;
        continue;
      }
      if (!DRY_RUN) {
        await collection.insertOne(doc);
      }
      stats.migrated++;
    } catch (err: any) {
      if (err.code === 11000) {
        stats.skipped++;
      } else {
        stats.errors++;
        console.error(`  Error in ${collectionName}: ${err.message}`);
      }
    }
  }
  return stats;
}

// ── Migration Functions ──

async function migrateCompanyToTenant(
  db: mongoose.Connection,
  tenantId: string,
  companies: any[],
): Promise<Stats> {
  const mapped = companies.map((c) => ({
    tenantId,
    name: c.companyName || '',
    slug: tenantId,
    email: c.email || `${tenantId}@flexacademy.in`,
    phone: c.companyPhone,
    website: c.companyWebsite,
    address: c.companyAddress,
    logo: c.logo,
    config: {
      receiptPrefix: c.reciptNumber || '',
      gstNumber: c.gst,
      isGstEnabled: c.isGstBased === 'true' || c.isGstBased === true,
      features: {},
    },
    isActive: true,
    plan: 'basic',
    createdAt: c.createdAt || new Date(),
    updatedAt: c.updatedAt || new Date(),
    _legacyId: c._id?.toString(),
  }));

  return upsertMany(db, 'tenants', mapped, (d) => ({ tenantId: d.tenantId, slug: d.slug }));
}

async function migrateUsers(
  db: mongoose.Connection,
  tenantId: string,
  users: any[],
): Promise<Stats> {
  const mapped = users.map((u) => ({
    tenantId,
    email: (u.email || '').toLowerCase().trim(),
    passwordHash: u.password || '',
    firstName: u.fName || '',
    lastName: u.lName || '',
    phone: u.phone,
    role: mapRole(u.role),
    isActive: true,
    createdAt: u.createdAt || new Date(),
    updatedAt: u.updatedAt || new Date(),
    _legacyId: u._id?.toString(),
  }));

  return upsertMany(db, 'users', mapped, (d) => ({ tenantId: d.tenantId, email: d.email }));
}

async function migrateStudents(
  db: mongoose.Connection,
  tenantId: string,
  students: any[],
  courseMap: Map<string, any>,
): Promise<Stats> {
  const mapped = students.map((s) => {
    const nameParts = (s.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const course = courseMap.get(s.courseName?.toString());

    return {
      tenantId,
      rollNumber: String(s.rollNumber || ''),
      firstName,
      lastName,
      fatherName: s.father_name,
      contact: {
        mobile: s.mobile_number || '',
        phone: s.phone_number,
        email: s.email,
        address: s.present_address,
        city: s.city,
      },
      dateOfBirth: s.date_of_birth,
      educationQualification: s.education_qualification,
      enrollment: {
        courseId: s.courseName?.toString() || '',
        courseName: course?.courseName || s.select_course || '',
        courseFees: parseFloat(s.course_fees) || 0,
        discount: s.discount || 0,
        netFees: s.netCourseFees || 0,
        remainingFees: s.remainingCourseFees || 0,
        totalPaid: s.totalPaid || 0,
        downPayment: parseFloat(s.down_payment) || 0,
        dateOfJoining: s.date_of_joining,
        installmentCount: s.no_of_installments || 0,
        installmentAmount: s.no_of_installments_amount || 0,
      },
      status: s.dropOutStudent ? 'dropout' : (s.student_status || 'active'),
      image: s.image,
      notes: s.message,
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date(),
      _legacyId: s._id?.toString(),
    };
  });

  return upsertMany(db, 'students', mapped, (d) => ({ tenantId: d.tenantId, rollNumber: d.rollNumber }));
}

async function migrateCourses(
  db: mongoose.Connection,
  tenantId: string,
  courses: any[],
  subjects: any[],
  courseTypes: any[],
  categories: any[],
  numberOfYears: any[],
): Promise<Stats> {
  const courseTypeMap = new Map(courseTypes.map((ct) => [ct._id?.toString(), ct.courseType || ct.name || '']));
  const categoryMap = new Map(categories.map((c) => [c._id?.toString(), c.category || '']));
  const yearsMap = new Map(numberOfYears.map((y) => [y._id?.toString(), y.numberOfYears || y.years || 1]));

  const subjectsByCourse = new Map<string, any[]>();
  for (const sub of subjects) {
    const courseId = sub.course?.toString() || '';
    if (!subjectsByCourse.has(courseId)) subjectsByCourse.set(courseId, []);
    subjectsByCourse.get(courseId)!.push(sub);
  }

  const mapped = courses.map((c) => {
    const courseSubjects = subjectsByCourse.get(c._id?.toString()) || [];
    return {
      tenantId,
      name: c.courseName || '',
      fees: c.courseFees || 0,
      courseType: courseTypeMap.get(c.courseType?.toString()) || 'Unknown',
      durationYears: yearsMap.get(c.numberOfYears?.toString()) || 1,
      category: categoryMap.get(c.category?.toString()) || 'General',
      subjects: courseSubjects.map((s) => ({
        name: s.subjectName || '',
        code: s.subjectCode || '',
        fullMarks: s.fullMarks || 100,
        passMarks: s.passMarks || 33,
        semester: parseInt(s.semYear) || 1,
      })),
      isActive: true,
      createdBy: c.createdBy || 'migration',
      createdAt: c.createdAt || new Date(),
      updatedAt: c.updatedAt || new Date(),
      _legacyId: c._id?.toString(),
    };
  });

  return upsertMany(db, 'courses', mapped, (d) => ({ tenantId: d.tenantId, name: d.name }));
}

async function migrateFees(
  db: mongoose.Connection,
  tenantId: string,
  fees: any[],
  paymentOptions: any[],
): Promise<Stats> {
  const paymentMap = new Map(paymentOptions.map((p) => [p._id?.toString(), p.name || 'cash']));

  const mapped = fees.map((f) => ({
    tenantId,
    studentId: f.studentInfo?.toString() || '',
    courseId: f.courseName?.toString() || '',
    netCourseFees: f.netCourseFees || 0,
    remainingFees: f.remainingFees || 0,
    amountPaid: f.amountPaid || 0,
    receiptNumber: f.reciptNumber || '',
    paymentMethod: paymentMap.get(f.paymentOption?.toString()) || 'cash',
    narration: f.narration,
    lateFees: f.lateFees || 0,
    gstPercentage: f.gst_percentage || 0,
    addedBy: f.addedBy || 'migration',
    paymentDate: f.amountDate ? new Date(f.amountDate) : (f.createdAt || new Date()),
    createdAt: f.createdAt || new Date(),
    updatedAt: f.updatedAt || new Date(),
    _legacyId: f._id?.toString(),
  }));

  return upsertMany(db, 'feepayments', mapped, (d) => ({ tenantId: d.tenantId, receiptNumber: d.receiptNumber }));
}

async function migrateAttendance(
  db: mongoose.Connection,
  tenantId: string,
  attendance: any[],
): Promise<Stats> {
  const mapped = attendance.map((a) => {
    const records = (a.students || []).map((s: any) => ({
      studentId: s.student?.toString() || '',
      days: s.days instanceof Map ? Object.fromEntries(s.days) : (s.days || {}),
    }));

    return {
      tenantId,
      batchId: a.batch?.toString() || '',
      month: a.month,
      year: a.year,
      records,
      createdAt: a.createdAt || new Date(),
      updatedAt: a.updatedAt || new Date(),
      _legacyId: a._id?.toString(),
    };
  });

  return upsertMany(db, 'attendances', mapped, (d) => ({
    tenantId: d.tenantId,
    batchId: d.batchId,
    month: d.month,
    year: d.year,
  }));
}

async function migrateTeachers(
  db: mongoose.Connection,
  tenantId: string,
  teachers: any[],
): Promise<Stats> {
  const mapped = teachers.map((t) => {
    const nameParts = (t.name || '').trim().split(/\s+/);
    return {
      tenantId,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: (t.email || '').toLowerCase().trim(),
      phone: t.phone || '',
      subjects: (t.subjects || []).map((s: any) => s?.toString()),
      qualification: t.qualification || '',
      experience: t.experience || 0,
      address: t.address || '',
      isActive: t.isActive !== false,
      joiningDate: t.joiningDate || t.createdAt || new Date(),
      createdAt: t.createdAt || new Date(),
      updatedAt: t.updatedAt || new Date(),
      _legacyId: t._id?.toString(),
    };
  });

  return upsertMany(db, 'teachers', mapped, (d) => ({ tenantId: d.tenantId, email: d.email }));
}

// ── Salon-specific Migrations ──

async function migrateSalonCustomers(
  db: mongoose.Connection,
  tenantId: string,
  customers: any[],
): Promise<Stats> {
  const mapped = customers.map((c) => ({
    tenantId,
    // Store in students collection with a salon-specific marker
    rollNumber: `SALON-${c._id?.toString()?.slice(-6) || '000000'}`,
    firstName: (c.name || '').split(/\s+/)[0] || '',
    lastName: (c.name || '').split(/\s+/).slice(1).join(' ') || '',
    contact: {
      mobile: c.phone || '',
      email: c.email,
      address: [c.street, c.city, c.state, c.country].filter(Boolean).join(', '),
      city: c.city,
    },
    enrollment: {
      courseId: '',
      courseName: 'Salon Customer',
      courseFees: 0,
      discount: 0,
      netFees: 0,
      remainingFees: 0,
      totalPaid: 0,
      downPayment: 0,
      dateOfJoining: c.createdAt || new Date(),
      installmentCount: 0,
      installmentAmount: 0,
    },
    status: 'active',
    createdAt: c.createdAt || new Date(),
    updatedAt: c.updatedAt || new Date(),
    _legacyId: c._id?.toString(),
    _legacyType: 'salon_customer',
  }));

  return upsertMany(db, 'students', mapped, (d) => ({ tenantId: d.tenantId, rollNumber: d.rollNumber }));
}

// ── Main ──

async function main() {
  console.log('='.repeat(70));
  console.log('  Flex Academy - Production Data Migration (from BSON dumps)');
  console.log('='.repeat(70));
  console.log(`  Target: Atlas staging (flex_academy_staging)`);
  console.log(`  Dry Run: ${DRY_RUN}`);
  console.log('='.repeat(70));

  const conn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log(`\nConnected to Atlas: ${conn.name}\n`);

  const allStats: Stats[] = [];

  for (const [key, { tenantId, dumpDir }] of Object.entries(TENANT_MAP)) {
    const dumpPath = path.join(DUMP_BASE, dumpDir);
    if (!fs.existsSync(dumpPath)) {
      console.log(`\nSkipping ${key}: dump directory not found at ${dumpPath}`);
      continue;
    }

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  TENANT: ${key} (${tenantId}) <- ${dumpDir}`);
    console.log(`${'─'.repeat(70)}`);

    // Read BSON files
    const companies = readBsonFile(path.join(dumpPath, 'companies.bson'));
    const users = readBsonFile(path.join(dumpPath, 'users.bson'));
    const students = readBsonFile(path.join(dumpPath, 'students.bson'));
    const courses = readBsonFile(path.join(dumpPath, 'courses.bson'));
    const subjects = readBsonFile(path.join(dumpPath, 'subjects.bson'));
    const courseTypes = readBsonFile(path.join(dumpPath, 'coursetypes.bson'));
    const categories = readBsonFile(path.join(dumpPath, 'categories.bson'));
    const numberOfYears = readBsonFile(path.join(dumpPath, 'numberofyears.bson'));
    const courseFees = readBsonFile(path.join(dumpPath, 'coursefees.bson'));
    const paymentOptions = readBsonFile(path.join(dumpPath, 'paymentoptions.bson'));
    const attendance = readBsonFile(path.join(dumpPath, 'attedences.bson'));
    const teachers = readBsonFile(path.join(dumpPath, 'teachers.bson'));
    const trainers = readBsonFile(path.join(dumpPath, 'trainers.bson'));

    // Build course lookup map for student enrollment
    const courseMap = new Map(courses.map((c) => [c._id?.toString(), c]));

    // 1. Company -> Tenant
    console.log(`  [1] Companies -> Tenants (${companies.length})`);
    allStats.push(await migrateCompanyToTenant(conn, tenantId, companies));

    // 2. Users
    console.log(`  [2] Users (${users.length})`);
    allStats.push(await migrateUsers(conn, tenantId, users));

    // 3. Courses + Subjects
    console.log(`  [3] Courses (${courses.length}) + Subjects (${subjects.length})`);
    allStats.push(await migrateCourses(conn, tenantId, courses, subjects, courseTypes, categories, numberOfYears));

    // 4. Students
    console.log(`  [4] Students (${students.length})`);
    allStats.push(await migrateStudents(conn, tenantId, students, courseMap));

    // 5. Fee Payments
    console.log(`  [5] Fee Payments (${courseFees.length})`);
    allStats.push(await migrateFees(conn, tenantId, courseFees, paymentOptions));

    // 6. Attendance
    console.log(`  [6] Attendance (${attendance.length})`);
    allStats.push(await migrateAttendance(conn, tenantId, attendance));

    // 7. Teachers/Trainers
    const allTeachers = [...teachers, ...trainers];
    console.log(`  [7] Teachers (${allTeachers.length})`);
    allStats.push(await migrateTeachers(conn, tenantId, allTeachers));

    // Salon-specific: customers
    if (key === 'salon_main') {
      const customers = readBsonFile(path.join(dumpPath, 'customers.bson'));
      console.log(`  [8] Salon Customers (${customers.length})`);
      allStats.push(await migrateSalonCustomers(conn, tenantId, customers));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('  MIGRATION SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`  ${'Collection'.padEnd(20)} ${'Total'.padEnd(8)} ${'Migrated'.padEnd(10)} ${'Skipped'.padEnd(9)} Errors`);
  console.log(`  ${'-'.repeat(60)}`);

  let totalMigrated = 0;
  let totalErrors = 0;
  for (const s of allStats) {
    console.log(`  ${s.collection.padEnd(20)} ${String(s.total).padEnd(8)} ${String(s.migrated).padEnd(10)} ${String(s.skipped).padEnd(9)} ${s.errors}`);
    totalMigrated += s.migrated;
    totalErrors += s.errors;
  }

  console.log(`  ${'-'.repeat(60)}`);
  console.log(`  Total records migrated: ${totalMigrated}`);
  console.log(`  Total errors: ${totalErrors}`);
  if (DRY_RUN) console.log(`\n  ** DRY RUN — No data was written to Atlas **`);
  console.log(`${'='.repeat(70)}`);

  await conn.close();
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
