import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionDocument extends Document {
  tenantId: string;
  studentName: string;
  commissionPersonName: string;
  voucherNumber: string;
  commissionAmount: number;
  commissionPaid: number;
  commissionRemaining: number;
  commissionDate: Date;
  narration: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommissionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    commissionPersonName: { type: String, required: true },
    voucherNumber: { type: String, default: '' },
    commissionAmount: { type: Number, required: true },
    commissionPaid: { type: Number, required: true },
    commissionRemaining: { type: Number, default: 0 },
    commissionDate: { type: Date, required: true },
    narration: { type: String, default: '' },
  },
  { timestamps: true },
);

commissionSchema.index({ tenantId: 1, commissionDate: -1 });

export const CommissionModel = mongoose.model<ICommissionDocument>('Commission', commissionSchema);
