import mongoose, { Schema, Document } from 'mongoose';

export interface IRollNumberDocument extends Document {
  tenantId: string;
  prefix: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const rollNumberSchema = new Schema<IRollNumberDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    prefix: { type: String, default: '' },
    currentValue: { type: Number, default: 1000 },
  },
  { timestamps: true },
);

rollNumberSchema.index({ tenantId: 1 }, { unique: true });

export const RollNumberModel = mongoose.model<IRollNumberDocument>(
  'RollNumberCounter',
  rollNumberSchema,
);
