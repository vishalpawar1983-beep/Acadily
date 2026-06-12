const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims';

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('flex_academy_dev');
  const collection = db.collection('defaultselects');

  // Get ALL distinct tenantIds to seed for ALL tenants that don't have data yet
  const tenants = await db.collection('tenants').distinct('tenantId');
  console.log('All tenants:', tenants);

  const existingTenants = await collection.distinct('tenantId');
  console.log('Tenants with defaultselects:', existingTenants);

  const missingTenants = tenants.filter(t => !existingTenants.includes(t));
  console.log('Tenants missing defaultselects:', missingTenants);

  const leadSourceOptions = [
    { label: 'Cold Call', value: 'Cold Call' },
    { label: 'Existing Customer', value: 'Existing Customer' },
    { label: 'Self Generated', value: 'Self Generated' },
    { label: 'Employee', value: 'Employee' },
    { label: 'Direct Mail', value: 'Direct Mail' },
    { label: 'Other', value: 'Other' },
    { label: 'Facebook', value: 'Facebook' },
    { label: 'Google Ads', value: 'Google Ads' },
    { label: 'Reference', value: 'Reference' },
    { label: 'Reliance HQ', value: 'Reliance HQ' },
    { label: 'Walk-in', value: 'Walk-in' },
    { label: 'Student', value: 'student' },
  ];

  const leadStatusOptions = [
    { label: 'Hot', value: 'Hot' },
    { label: 'Junk Lead', value: 'Junk Lead' },
    { label: 'Positive', value: 'Positive' },
    { label: 'Negative', value: 'Negative' },
    { label: 'Progress', value: 'Progress' },
    { label: 'Converted', value: 'Converted' },
    { label: 'Attempted To Contact', value: 'Attempted To Contact' },
    { label: 'Not Contacted', value: 'Not Contacted' },
    { label: 'Not Picked', value: 'not-picked' },
  ];

  const docs = [];
  for (const tenantId of missingTenants) {
    docs.push({
      tenantId,
      selectName: 'Lead Source',
      fieldType: 'select',
      options: leadSourceOptions,
      isMandatory: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    docs.push({
      tenantId,
      selectName: 'Lead Status',
      fieldType: 'select',
      options: leadStatusOptions,
      isMandatory: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (docs.length > 0) {
    const result = await collection.insertMany(docs);
    console.log('Inserted', result.insertedCount, 'records for', missingTenants.length, 'tenants');
  } else {
    console.log('No missing tenants - all have data');
  }

  // Verify
  const allSelects = await collection.find({}).toArray();
  console.log('\nAll defaultselects now:');
  allSelects.forEach(d => console.log('  tenant:', d.tenantId, '| name:', d.selectName));

  await client.close();
}
seed();
