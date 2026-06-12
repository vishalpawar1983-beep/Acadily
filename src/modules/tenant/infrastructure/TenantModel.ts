import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantDocument extends Document {
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  config: {
    receiptPrefix: string;
    gstNumber?: string;
    isGstEnabled: boolean;
    features: Record<string, boolean>;
  };
  isActive: boolean;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenantDocument>(
  {
    tenantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    phone: { type: String },
    website: { type: String },
    address: { type: String },
    logo: { type: String },
    config: {
      receiptPrefix: { type: String, default: '' },
      gstNumber: { type: String },
      isGstEnabled: { type: Boolean, default: false },
      features: { type: Schema.Types.Mixed, default: {} },
    },
    isActive: { type: Boolean, default: true },
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
  },
  { timestamps: true },
);

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ tenantId: 1 }, { unique: true });

export const TenantModel = mongoose.model<ITenantDocument>('Tenant', tenantSchema);
