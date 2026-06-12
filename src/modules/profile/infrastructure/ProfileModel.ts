import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileDocument extends Document {
  tenantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  company: string;
  contactPhone: string;
  companySite: string;
  country: string;
  language: string;
  timeZone: string;
  currency: string;
  communications: {
    email: boolean;
    phone: boolean;
  };
  allowMarketing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfileDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    company: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    companySite: { type: String, default: '' },
    country: { type: String, default: '' },
    language: { type: String, default: '' },
    timeZone: { type: String, default: '' },
    currency: { type: String, default: '' },
    communications: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
    },
    allowMarketing: { type: Boolean, default: false },
  },
  { timestamps: true },
);

profileSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const ProfileModel = mongoose.model<IProfileDocument>('ProfileDetails', profileSchema);
