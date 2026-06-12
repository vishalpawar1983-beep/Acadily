import mongoose from 'mongoose';

const uri = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims';

async function main() {
  const conn = await mongoose.createConnection(uri).asPromise();
  const user = await conn.collection('users').findOne({
    tenantId: 'ims_reliance',
    email: 'visualmediatechnology@gmail.com',
  });
  console.log(JSON.stringify({
    _id: user?._id,
    email: user?.email,
    passwordHash: user?.passwordHash?.substring(0, 30) + '...',
    role: user?.role,
    firstName: user?.firstName,
    lastName: user?.lastName,
    tenantId: user?.tenantId,
    isActive: user?.isActive,
  }, null, 2));

  // Also count total users for this tenant
  const count = await conn.collection('users').countDocuments({ tenantId: 'ims_reliance' });
  console.log(`\nTotal ims_reliance users: ${count}`);

  await conn.close();
}

main().catch(console.error);
