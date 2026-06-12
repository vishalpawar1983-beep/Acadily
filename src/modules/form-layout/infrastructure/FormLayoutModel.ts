import mongoose, { Schema, Document } from 'mongoose';

export interface IFormLayoutDocument extends Document {
  tenantId: string;
  formId: string;
  type: string;
  items: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const layoutItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const formLayoutSchema = new Schema<IFormLayoutDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    formId: { type: String, required: true },
    type: { type: String, required: true, enum: ['column', 'row'] },
    items: [layoutItemSchema],
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

formLayoutSchema.index({ tenantId: 1, formId: 1, type: 1 });

export const FormLayoutModel = mongoose.model<IFormLayoutDocument>(
  'FormLayout',
  formLayoutSchema,
);
