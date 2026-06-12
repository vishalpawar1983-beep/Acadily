import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ATLAS_BASE = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net';
const DBS = ['flex_academy_dev', 'flex_academy_staging'];

async function main() {
  const passwordHash = await bcrypt.hash('Lucky@9856', 10);

  for (const dbName of DBS) {
    const uri = `${ATLAS_BASE}/${dbName}?retryWrites=true&w=majority&appName=Cluster-ims`;
    const conn = await mongoose.createConnection(uri).asPromise();
    console.log(`Connected to ${dbName}`);

    // Check if user exists
    const existing = await conn.collection('users').findOne({
      tenantId: 'ims_reliance',
      email: 'aiinfox@flexacademy.in',
    });

    if (existing) {
      // Just promote to SuperAdmin
      await conn.collection('users').updateOne(
        { _id: existing._id },
        { $set: { role: 'SuperAdmin', passwordHash } },
      );
      console.log(`  Updated existing user -> SuperAdmin (${dbName})`);
    } else {
      // Create new
      await conn.collection('users').insertOne({
        tenantId: 'ims_reliance',
        email: 'aiinfox@flexacademy.in',
        passwordHash,
        firstName: 'Aiinfox',
        lastName: 'Admin',
        role: 'SuperAdmin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  Created SuperAdmin user (${dbName})`);
    }

    await conn.close();
  }

  console.log('\nDone. aiinfox@flexacademy.in / Lucky@9856 is SuperAdmin in both databases.');
}

main().catch(console.error);
