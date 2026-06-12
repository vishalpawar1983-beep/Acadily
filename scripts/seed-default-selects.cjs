const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims';

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('flex_academy_dev');
    const collection = db.collection('defaultselects');

    // Check existing data
    const existing = await collection.find({ tenantId: 'flex_academy_dev' }).toArray();
    console.log('Existing records:', existing.length);
    if (existing.length > 0) {
      console.log('Already has data:', existing.map(d => d.selectName));
      return;
    }

    // Insert Lead Source
    const leadSource = {
      tenantId: 'flex_academy_dev',
      selectName: 'Lead Source',
      options: [
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
      ],
      mandatory: true,
      type: 'select',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert Lead Status
    const leadStatus = {
      tenantId: 'flex_academy_dev',
      selectName: 'Lead Status',
      options: [
        { label: 'Hot', value: 'Hot' },
        { label: 'Junk Lead', value: 'Junk Lead' },
        { label: 'Positive', value: 'Positive' },
        { label: 'Negative', value: 'Negative' },
        { label: 'Progress', value: 'Progress' },
        { label: 'Converted', value: 'Converted' },
        { label: 'Attempted To Contact', value: 'Attempted To Contact' },
        { label: 'Not Contacted', value: 'Not Contacted' },
        { label: 'Not Picked', value: 'not-picked' },
      ],
      mandatory: true,
      type: 'select',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertMany([leadSource, leadStatus]);
    console.log('Inserted', result.insertedCount, 'records');
    console.log('IDs:', result.insertedIds);

    // Verify
    const verify = await collection.find({ tenantId: 'flex_academy_dev' }).toArray();
    console.log('Verification - records found:', verify.length);
    verify.forEach(d => {
      console.log(`  - ${d.selectName}: ${d.options.length} options`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

seed();
