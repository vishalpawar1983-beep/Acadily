import mongoose, { Schema, type Document } from 'mongoose';

export interface IPaymentTransactionDocument extends Document {
  tenantId: string;
  transactionId: string;
  studentId: string;
  amount: number;
  status: 'pending' | 'success' | 'failure';
  paymentGateway: 'easebuzz';
  gatewayResponse: Record<string, unknown>;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransactionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    transactionId: { type: String, required: true },
    studentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failure'], default: 'pending' },
    paymentGateway: { type: String, enum: ['easebuzz'], default: 'easebuzz' },
    gatewayResponse: { type: Schema.Types.Mixed, default: {} },
    courseId: { type: String, required: true },
  },
  { timestamps: true },
);

paymentTransactionSchema.index({ tenantId: 1, transactionId: 1 }, { unique: true });

export const PaymentTransactionModel = mongoose.model<IPaymentTransactionDocument>(
  'PaymentTransaction',
  paymentTransactionSchema,
);
