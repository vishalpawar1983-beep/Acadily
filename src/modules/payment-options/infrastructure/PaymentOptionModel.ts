import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentOptionDocument extends Document {
  tenantId: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentOptionSchema = new Schema<IPaymentOptionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

paymentOptionSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const PaymentOptionModel = mongoose.model<IPaymentOptionDocument>(
  'PaymentOption',
  paymentOptionSchema,
);
