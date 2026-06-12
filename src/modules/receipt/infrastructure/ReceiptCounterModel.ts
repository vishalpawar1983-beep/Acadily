import mongoose, { Schema, Document } from 'mongoose';

export interface IReceiptCounterDocument extends Document {
  tenantId: string;
  prefix: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const receiptCounterSchema = new Schema<IReceiptCounterDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    prefix: { type: String, required: true },
    currentValue: { type: Number, default: 100 },
  },
  { timestamps: true },
);

receiptCounterSchema.index({ tenantId: 1 }, { unique: true });

export const ReceiptCounterModel = mongoose.model<IReceiptCounterDocument>('ReceiptCounter', receiptCounterSchema);
