import mongoose, { Schema, Document } from 'mongoose';

export interface IBatchCategoryDocument extends Document {
  tenantId: string;
  categoryName: string;
  createdBy: string;
  // Optional company-profile fields (populated when used as a company/campus record)
  email?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyAddress?: string;
  reciptNumber?: string;
  gst?: string;
  isGstBased?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const batchCategorySchema = new Schema<IBatchCategoryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    categoryName: { type: String, required: true },
    createdBy: { type: String, required: true },
    // Company-profile fields — optional, set via PUT /api/company/:id
    email: { type: String },
    companyPhone: { type: String },
    companyWebsite: { type: String },
    companyAddress: { type: String },
    reciptNumber: { type: String },
    gst: { type: String },
    isGstBased: { type: String, default: 'No' },
    logo: { type: String },
  },
  { timestamps: true },
);

batchCategorySchema.index({ tenantId: 1, categoryName: 1 }, { unique: true });

export const BatchCategoryModel = mongoose.model<IBatchCategoryDocument>(
  'BatchCategory',
  batchCategorySchema,
);
