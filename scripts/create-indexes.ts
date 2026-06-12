/**
 * Database Index Creation Script
 *
 * Creates all necessary indexes for the multi-tenant Flex Academy database.
 * Safe to run multiple times (createIndex is idempotent).
 *
 * Usage: npx tsx scripts/create-indexes.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

interface IndexDef {
  collection: string;
  indexes: Array<{
    keys: Record<string, 1 | -1 | 'text'>;
    options?: mongoose.IndexOptions;
  }>;
}

const indexDefinitions: IndexDef[] = [
  {
    collection: 'users',
    indexes: [
      // Primary lookup: find user by email within a tenant
      { keys: { tenantId: 1, email: 1 }, options: { unique: true } },
      // Auth guard: find user by id within tenant
      { keys: { tenantId: 1, _id: 1 } },
      // Role-based queries
      { keys: { tenantId: 1, role: 1 } },
    ],
  },
  {
    collection: 'tenants',
    indexes: [
      // Tenant resolution by slug
      { keys: { slug: 1 }, options: { unique: true } },
      // Tenant resolution by tenantId
      { keys: { tenantId: 1 }, options: { unique: true } },
    ],
  },
  {
    collection: 'students',
    indexes: [
      // Primary: list students for a tenant
      { keys: { tenantId: 1, createdAt: -1 } },
      // Roll number lookup within tenant
      { keys: { tenantId: 1, rollNumber: 1 }, options: { unique: true } },
      // Status filtering
      { keys: { tenantId: 1, status: 1 } },
      // Course-based queries
      { keys: { tenantId: 1, 'enrollment.courseId': 1 } },
      // Name search
      { keys: { tenantId: 1, firstName: 1, lastName: 1 } },
    ],
  },
  {
    collection: 'courses',
    indexes: [
      // List courses for tenant
      { keys: { tenantId: 1, isActive: 1 } },
      // Course name lookup within tenant
      { keys: { tenantId: 1, name: 1 } },
      // Category filtering
      { keys: { tenantId: 1, category: 1 } },
    ],
  },
  {
    collection: 'feepayments',
    indexes: [
      // Student fee history
      { keys: { tenantId: 1, studentId: 1, paymentDate: -1 } },
      // Receipt lookup
      { keys: { tenantId: 1, receiptNumber: 1 }, options: { unique: true } },
      // Date-range queries (day book)
      { keys: { tenantId: 1, paymentDate: -1 } },
      // Course-based fee reports
      { keys: { tenantId: 1, courseId: 1 } },
    ],
  },
  {
    collection: 'attendances',
    indexes: [
      // Primary: find attendance for batch + month
      { keys: { tenantId: 1, batchId: 1, year: 1, month: 1 }, options: { unique: true } },
      // Student attendance queries
      { keys: { tenantId: 1, 'records.studentId': 1 } },
    ],
  },
];

async function main() {
  console.log('Connecting to MongoDB...');
  const conn = await mongoose.connect(MONGO_URI!);
  console.log(`Connected to ${conn.connection.name}\n`);

  let totalCreated = 0;

  for (const def of indexDefinitions) {
    console.log(`[${def.collection}]`);
    const collection = conn.connection.db!.collection(def.collection);

    for (const idx of def.indexes) {
      try {
        const name = await collection.createIndex(idx.keys as any, idx.options || {});
        console.log(`  Created: ${name}`);
        totalCreated++;
      } catch (err) {
        console.error(`  Error: ${(err as Error).message}`);
      }
    }
    console.log();
  }

  console.log(`Done. ${totalCreated} indexes created/verified.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Index creation failed:', err);
  process.exit(1);
});
