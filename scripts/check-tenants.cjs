const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims';

async function check() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('flex_academy_dev');

    // Check all records in defaultselects
    const selects = await db.collection('defaultselects').find({}).toArray();
    console.log('=== All defaultselects records ===');
    selects.forEach(d => {
      console.log(`  tenantId: "${d.tenantId}", selectName: "${d.selectName}", options: ${d.options?.length || 0}`);
    });

    // Check what tenantIds exist in the users collection
    const users = await db.collection('users').find({}, { projection: { email: 1, tenantId: 1, _legacyId: 1 } }).limit(5).toArray();
    console.log('\n=== Users (sample) ===');
    users.forEach(u => {
      console.log(`  email: "${u.email}", tenantId: "${u.tenantId}", _legacyId: "${u._legacyId}"`);
    });

    // Check distinct tenantIds in the DB
    const tenantIds = await db.collection('users').distinct('tenantId');
    console.log('\n=== Distinct tenantIds in users ===');
    console.log(tenantIds);

    // Check tenants collection
    const tenants = await db.collection('tenants').find({}).toArray();
    console.log('\n=== Tenants collection ===');
    tenants.forEach(t => {
      console.log(`  tenantId: "${t.tenantId}", name: "${t.name}", slug: "${t.slug}"`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

check();
