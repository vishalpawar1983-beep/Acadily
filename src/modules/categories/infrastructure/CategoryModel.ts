import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDocument extends Document {
  tenantId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const CategoryModel = mongoose.model<ICategoryDocument>('Category', categorySchema);
