import 'dotenv/config';
import mongoose from 'mongoose';
import { TenantModel } from '../src/modules/tenant/infrastructure/TenantModel.js';

const TENANTS = [
  {
    tenantId: 'ims_reliance',
    name: 'IMS Reliance Institute',
    slug: 'ims_reliance',
    email: 'admin@imsreliance.com',
    phone: '+91-9876543210',
    website: 'https://imsreliance.com',
    address: 'Mumbai, Maharashtra, India',
    config: {
      receiptPrefix: 'IMS',
      gstNumber: '27AABCU9603R1ZM',
      isGstEnabled: true,
      features: { admissions: true, attendance: true, exams: true, fees: true },
    },
    isActive: true,
    plan: 'premium',
  },
  {
    tenantId: 'chanakya',
    name: 'Chanakya Institute',
    slug: 'chanakya',
    email: 'admin@chanakyainstitute.com',
    phone: '+91-9876543211',
    website: 'https://chanakyainstitute.com',
    address: 'Pune, Maharashtra, India',
    config: {
      receiptPrefix: 'CHK',
      isGstEnabled: false,
      features: { admissions: true, attendance: true, exams: true, fees: true },
    },
    isActive: true,
    plan: 'basic',
  },
  {
    tenantId: 'webliquid',
    name: 'WebliquidStudio/Dabims',
    slug: 'webliquid',
    email: 'admin@webliquidstudio.com',
    phone: '+91-9876543212',
    website: 'https://webliquidstudio.com',
    address: 'Nagpur, Maharashtra, India',
    config: {
      receiptPrefix: 'WLS',
      isGstEnabled: false,
      features: { admissions: true, attendance: true, exams: true, fees: true },
    },
    isActive: true,
    plan: 'premium',
  },
  {
    tenantId: 'salon_main',
    name: 'Salon Management',
    slug: 'salon_main',
    email: 'admin@salonmgmt.com',
    phone: '+91-9876543213',
    website: 'https://salonmgmt.com',
    address: 'Delhi, India',
    config: {
      receiptPrefix: 'SLN',
      gstNumber: '07AABCU9603R1ZP',
      isGstEnabled: true,
      features: { appointments: true, billing: true, inventory: true },
    },
    isActive: true,
    plan: 'basic',
  },
];

async function seed(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/flex_academy';
  console.log(`Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  for (const tenantData of TENANTS) {
    const existing = await TenantModel.findOne({ slug: tenantData.slug }).exec();
    if (existing) {
      console.log(`Tenant "${tenantData.name}" (${tenantData.slug}) already exists — skipping`);
      continue;
    }

    await TenantModel.create(tenantData);
    console.log(`Created tenant: "${tenantData.name}" (${tenantData.slug})`);
  }

  console.log('Seed complete');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
