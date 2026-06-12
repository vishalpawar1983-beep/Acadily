import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentAlertDocument extends Document {
  tenantId: string;
  studentId?: string;
  date: Date;
  reminderDateTime: Date;
  status: string;
  particulars: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentAlertSchema = new Schema<IStudentAlertDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, index: true },
    date: { type: Date, required: true },
    reminderDateTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'dismissed'],
      default: 'pending',
    },
    particulars: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

studentAlertSchema.index({ tenantId: 1, status: 1 });

export const StudentAlertModel = mongoose.model<IStudentAlertDocument>(
  'StudentAlert',
  studentAlertSchema,
);
