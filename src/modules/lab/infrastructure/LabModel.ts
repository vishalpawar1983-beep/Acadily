import mongoose, { Schema, Document } from 'mongoose';

export interface ILabDocument extends Document {
  tenantId: string;
  labName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labSchema = new Schema<ILabDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    labName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

labSchema.index({ tenantId: 1, labName: 1 }, { unique: true });

export const LabModel = mongoose.model<ILabDocument>('Lab', labSchema);
