import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mongoose from 'mongoose';
import { logger } from '../logger/PinoLogger.js';

/**
 * Per-company database backups.
 *
 * Each day, every company's data (its record, students and their fees/payments/marks/
 * notes/issues, enquiries, daybook, commissions, courses, forms) is exported to a
 * gzipped JSON file under <baseDir>/<YYYY-MM-DD>/<tenantId>/<companyId>.json.gz.
 * Only the most recent RETENTION_DAYS days are kept. Files are restorable (insertMany).
 */

const RETENTION_DAYS = 3;

// Collections matched by companyId (string company reference).
const COMPANY_COLLECTIONS = [
  'formsubmissions', 'formlayouts', 'formdefinitions', 'customfields',
  'daybookaccounts', 'daybookentries', 'commissions', 'courses', 'batches',
];
// Collections matched by studentId (the company's students).
const STUDENT_COLLECTIONS = [
  'coursefees', 'feepayments', 'feeinstallments',
  'studentmarks', 'studentissues', 'studentnotes', 'studentalerts',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function backupBaseDir(): string {
  return process.env.BACKUP_DIR || '/app/backups';
}

export function companyIdOf(comp: any): string {
  return comp._legacyId ? String(comp._legacyId) : comp._id.toString();
}

async function exportCompany(db: any, tenantId: string, comp: any): Promise<Record<string, any[]>> {
  const cVals = Array.from(
    new Set([comp._id?.toString(), comp._legacyId].filter(Boolean).map(String)),
  );

  // Students of this company (referenced by companyName or enrollment.companyId).
  const students = await db
    .collection('students')
    .find({ tenantId, $or: [{ companyName: { $in: cVals } }, { 'enrollment.companyId': { $in: cVals } }] })
    .toArray();

  // Student id forms (fees/marks may store ObjectId or string).
  const sIds: any[] = [];
  for (const s of students) {
    sIds.push(s._id);
    sIds.push(s._id.toString());
    if (s._legacyId) sIds.push(String(s._legacyId));
  }

  const result: Record<string, any[]> = {
    batchcategories: [comp],
    students,
  };

  for (const coll of COMPANY_COLLECTIONS) {
    try {
      result[coll] = await db.collection(coll).find({ tenantId, companyId: { $in: cVals } }).toArray();
    } catch { result[coll] = []; }
  }
  if (sIds.length) {
    for (const coll of STUDENT_COLLECTIONS) {
      try {
        result[coll] = await db.collection(coll).find({ tenantId, studentId: { $in: sIds } }).toArray();
      } catch { result[coll] = []; }
    }
  }
  return result;
}

function pruneOldDates(baseDir: string): void {
  if (!fs.existsSync(baseDir)) return;
  const dates = fs
    .readdirSync(baseDir)
    .filter((d) => DATE_RE.test(d))
    .sort()
    .reverse();
  for (const d of dates.slice(RETENTION_DAYS)) {
    fs.rmSync(path.join(baseDir, d), { recursive: true, force: true });
  }
}

/** Run the daily per-company backup. Returns a small summary. */
export async function runCompanyBackups(): Promise<{ date: string; files: number }> {
  const db = mongoose.connection.db!;
  const baseDir = backupBaseDir();
  const date = new Date().toISOString().slice(0, 10);

  const companies = await db.collection('batchcategories').find({}).toArray();
  let files = 0;
  for (const comp of companies as any[]) {
    const tenantId = comp.tenantId;
    if (!tenantId) continue;
    try {
      const data = await exportCompany(db, tenantId, comp);
      const dir = path.join(baseDir, date, tenantId);
      fs.mkdirSync(dir, { recursive: true });
      const payload = {
        meta: {
          date,
          tenantId,
          companyId: companyIdOf(comp),
          companyName: comp.categoryName || comp.companyName || comp.name || '',
          generatedAt: new Date().toISOString(),
        },
        counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
        data,
      };
      const gz = zlib.gzipSync(Buffer.from(JSON.stringify(payload), 'utf8'));
      fs.writeFileSync(path.join(dir, companyIdOf(comp) + '.json.gz'), gz);
      files++;
    } catch (err) {
      logger.error({ err, companyId: companyIdOf(comp) }, 'Company backup failed');
    }
  }
  pruneOldDates(baseDir);
  logger.info({ date, files }, 'Company backups complete');
  return { date, files };
}

export interface BackupEntry {
  date: string;
  companyId: string;
  sizeBytes: number;
}

/** List available backups for a tenant (most recent date first). */
export function listBackups(tenantId: string): BackupEntry[] {
  const baseDir = backupBaseDir();
  if (!fs.existsSync(baseDir)) return [];
  const out: BackupEntry[] = [];
  const dates = fs.readdirSync(baseDir).filter((d) => DATE_RE.test(d)).sort().reverse();
  for (const date of dates) {
    const dir = path.join(baseDir, date, tenantId);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json.gz')) continue;
      const stat = fs.statSync(path.join(dir, f));
      out.push({ date, companyId: f.replace(/\.json\.gz$/, ''), sizeBytes: stat.size });
    }
  }
  return out;
}

/** Resolve a backup file path for a tenant (validates inputs to prevent traversal). */
export function backupFilePath(tenantId: string, date: string, companyId: string): string | null {
  if (!DATE_RE.test(date)) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(companyId)) return null;
  const p = path.join(backupBaseDir(), date, tenantId, companyId + '.json.gz');
  if (!fs.existsSync(p)) return null;
  return p;
}
