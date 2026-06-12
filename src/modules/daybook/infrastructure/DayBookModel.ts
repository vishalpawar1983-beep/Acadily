import mongoose, { Schema, Document } from 'mongoose';

export interface IDayBookAccountDocument extends Document {
  tenantId: string;
  accountName: string;
  accountId: string;
  accountType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dayBookAccountSchema = new Schema<IDayBookAccountDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    accountName: { type: String, required: true },
    accountId: { type: String, default: '' },
    accountType: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

dayBookAccountSchema.index({ tenantId: 1, accountName: 1 }, { unique: true });

export const DayBookAccountModel = mongoose.model<IDayBookAccountDocument>(
  'DayBookAccount',
  dayBookAccountSchema,
);

export interface IDayBookEntryDocument extends Document {
  tenantId: string;
  accountId: string;
  accountName: string;
  accountType: string;
  companyId: string;
  date: Date;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  studentId: string;
  studentName: string;
  rollNumber: string;
  receiptNumber: string;
  linkAccountId: string;
  linkAccountName: string;
  linkAccountType: string;
  linkDayBookAccountData: string;
  createdAt: Date;
  updatedAt: Date;
}

const dayBookEntrySchema = new Schema<IDayBookEntryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    accountId: { type: String, required: true },
    accountName: { type: String, default: '' },
    accountType: { type: String, default: '' },
    companyId: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    narration: { type: String, default: '' },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    studentId: { type: String, default: '' },
    studentName: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    linkAccountId: { type: String, default: '' },
    linkAccountName: { type: String, default: '' },
    linkAccountType: { type: String, default: '' },
    linkDayBookAccountData: { type: String, default: '' },
  },
  { timestamps: true },
);

dayBookEntrySchema.index({ tenantId: 1, date: -1 });

export const DayBookEntryModel = mongoose.model<IDayBookEntryDocument>(
  'DayBookEntry',
  dayBookEntrySchema,
);
