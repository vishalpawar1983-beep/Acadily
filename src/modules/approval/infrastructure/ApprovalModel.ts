import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalDocument extends Document {
  tenantId: string;
  receiptId: string;
  studentId: string;
  status: string;
  reviewedBy: string;
  reviewedAt: Date | null;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const approvalSchema = new Schema<IApprovalDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    receiptId: { type: String, required: true },
    studentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
  },
  { timestamps: true },
);

approvalSchema.index({ tenantId: 1, status: 1 });
approvalSchema.index({ tenantId: 1, studentId: 1 });

export const ApprovalModel = mongoose.model<IApprovalDocument>('Approval', approvalSchema);
