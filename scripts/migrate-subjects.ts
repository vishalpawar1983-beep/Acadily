/**
 * Subjects Migration Script
 *
 * The original migration stored subjects embedded inside courses.subjects[].
 * The DDD subjects collection expects separate documents.
 * This script extracts them and creates proper Subject documents.
 *
 * Usage:
 *   npx tsx scripts/migrate-subjects.ts [--dry-run]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

async function run() {
  console.log('Connecting to IMS fullstack DB...');
  await mongoose.connect(MONGO_URI!);
  const db = mongoose.connection.db!;

  // Get all courses that have embedded subjects
  const courses = await db.collection('courses').find({ 'subjects.0': { $exists: true } }).toArray();
  console.log(`Found ${courses.length} courses with embedded subjects`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const course of courses) {
    const embeddedSubjects: any[] = course.subjects || [];
    if (!embeddedSubjects.length) continue;

    // courseId for subjects = _legacyId of the course (matches student.enrollment.courseId after migration)
    const legacyCourseId = course._legacyId ? String(course._legacyId) : course._id.toString();
    const tenantId = course.tenantId;

    console.log(`\nCourse: "${course.name}" (_legacyId: ${legacyCourseId}) — ${embeddedSubjects.length} subjects`);

    for (const sub of embeddedSubjects) {
      const subjectCode = sub.code || sub.subjectCode || '';
      const subjectName = sub.name || sub.subjectName || '';

      try {
        // Check if already migrated (by subjectCode + courseId)
        const existing = await db.collection('subjects').findOne({
          $or: [
            { subjectCode, courseId: legacyCourseId },
            { subjectCode, courseId: course._id.toString() },
          ],
        });

        if (existing) {
          console.log(`  SKIP (exists): ${subjectCode} - ${subjectName}`);
          skipped++;
          continue;
        }

        const semYear = sub.semYear
          ? String(sub.semYear)
          : sub.semester
          ? `Year ${sub.semester}`
          : '1';

        const doc = {
          _id: new mongoose.Types.ObjectId(),
          tenantId,
          subjectName,
          subjectCode,
          fullMarks: sub.fullMarks || 100,
          passMarks: sub.passMarks || 33,
          semYear,
          courseId: legacyCourseId,
          addedBy: 'migration',
          createdAt: sub.createdAt || new Date(),
          updatedAt: sub.updatedAt || new Date(),
        };

        if (!dryRun) {
          await db.collection('subjects').insertOne(doc);
        }

        console.log(`  ${dryRun ? '[DRY] ' : ''}MIGRATED: ${subjectCode} - ${subjectName} (semYear: ${semYear})`);
        migrated++;
      } catch (err) {
        console.error(`  ERROR: ${subjectCode}:`, (err as Error).message);
        errors++;
      }
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Migrated : ${migrated}`);
  console.log(`Skipped  : ${skipped}`);
  console.log(`Errors   : ${errors}`);

  if (dryRun) console.log('\n[DRY RUN — no changes written]');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
