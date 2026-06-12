import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeInstallmentDocument extends Document {
  tenantId: string;
  studentId: string;
  courseId: string;
  installmentNumber: number;
  installmentAmount: number;
  dueDate: Date;
  paidDate: Date | null;
  isPaid: boolean;
  isDropout: boolean;
  lateFeeAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const feeInstallmentSchema = new Schema<IFeeInstallmentDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    courseId: { type: String, required: true },
    installmentNumber: { type: Number, required: true },
    installmentAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
    isPaid: { type: Boolean, default: false },
    isDropout: { type: Boolean, default: false },
    lateFeeAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

feeInstallmentSchema.index(
  { tenantId: 1, studentId: 1, courseId: 1, installmentNumber: 1 },
  { unique: true },
);
feeInstallmentSchema.index({ tenantId: 1, dueDate: 1, isPaid: 1, isDropout: 1 });

export const FeeInstallmentModel = mongoose.model<IFeeInstallmentDocument>('FeeInstallment', feeInstallmentSchema);
