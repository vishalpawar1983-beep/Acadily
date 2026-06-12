const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('flex_academy_dev');

  // Find the company from the URL: 69f9b76c0c4bc645a3fae773
  const companyId = '69f9b76c0c4bc645a3fae773';
  let company;
  try {
    company = await db.collection('companies').findOne({ _id: new ObjectId(companyId) });
  } catch(e) {}
  if (!company) {
    company = await db.collection('companies').findOne({ _legacyId: companyId });
  }
  console.log('Company from URL:', company ? {
    name: company.companyName || company.name,
    tenantId: company.tenantId,
    _id: company._id.toString(),
    _legacyId: company._legacyId
  } : 'NOT FOUND');

  // Search for Oscar company
  const oscarCompanies = await db.collection('companies').find({
    companyName: { $regex: /oscar/i }
  }).toArray();
  console.log('\nOscar companies:');
  oscarCompanies.forEach(c => console.log('  ', c.companyName, '| tenantId:', c.tenantId, '| _id:', c._id.toString()));

  // Check ALL distinct tenantIds in defaultselects
  const selectTenants = await db.collection('defaultselects').distinct('tenantId');
  console.log('\nTenantIds in defaultselects:', selectTenants);

  // Check ALL records
  const allSelects = await db.collection('defaultselects').find({}).toArray();
  console.log('\nAll defaultselects:');
  allSelects.forEach(d => console.log('  tenant:', d.tenantId, '| name:', d.selectName));

  // All tenants
  const tenants = await db.collection('tenants').find({}).project({ tenantId: 1, name: 1 }).toArray();
  console.log('\nAll tenants:');
  tenants.forEach(t => console.log('  ', t.tenantId, '-', t.name));

  await client.close();
}
check();
