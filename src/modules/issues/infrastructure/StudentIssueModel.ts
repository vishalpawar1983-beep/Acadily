import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentIssueDocument extends Document {
  tenantId: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  showOnDashboard: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentIssueSchema = new Schema<IStudentIssueDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    particulars: { type: String, required: true },
    addedBy: { type: String, required: true },
    showOnDashboard: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['open', 'inProgress', 'resolved', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true },
);

studentIssueSchema.index({ tenantId: 1, studentId: 1 });
studentIssueSchema.index({ tenantId: 1, status: 1 });

export const StudentIssueModel = mongoose.model<IStudentIssueDocument>(
  'StudentIssue',
  studentIssueSchema,
);

export interface IIssueDashboardDocument extends Document {
  tenantId: string;
  studentId: string;
  showStudent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const issueDashboardSchema = new Schema<IIssueDashboardDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    showStudent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

issueDashboardSchema.index({ tenantId: 1, studentId: 1 }, { unique: true });

export const IssueDashboardModel = mongoose.model<IIssueDashboardDocument>(
  'IssueDashboard',
  issueDashboardSchema,
);
