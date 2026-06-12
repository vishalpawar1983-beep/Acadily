import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeDocument extends Document {
  tenantId: string;
  studentId: string;
  courseId: string;
  netCourseFees: number;
  remainingFees: number;
  amountPaid: number;
  receiptNumber: string;
  paymentMethod: string;
  narration?: string;
  lateFees: number;
  gstPercentage: number;
  addedBy: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFeeDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    courseId: { type: String, required: true },
    netCourseFees: { type: Number, required: true },
    remainingFees: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    receiptNumber: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    narration: { type: String },
    lateFees: { type: Number, default: 0 },
    gstPercentage: { type: Number, required: true },
    addedBy: { type: String, required: true },
    paymentDate: { type: Date, required: true },
  },
  { timestamps: true },
);

feeSchema.index({ tenantId: 1, studentId: 1 });
feeSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });

export const FeeModel = mongoose.model<IFeeDocument>('FeePayment', feeSchema);
