import mongoose from 'mongoose';

async function main() {
  const uri = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims';
  const conn = await mongoose.createConnection(uri).asPromise();

  const result = await conn.collection('users').updateOne(
    { email: 'aiinfox@flexacademy.in', tenantId: 'ims_reliance' },
    { $set: { role: 'SuperAdmin' } },
  );

  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  console.log('aiinfox@flexacademy.in is now SuperAdmin for ims_reliance');

  await conn.close();
}

main().catch(console.error);
