import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentNoteDocument extends Document {
  tenantId: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  startTime: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const studentNoteSchema = new Schema<IStudentNoteDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    particulars: { type: String, required: true },
    addedBy: { type: String, default: '' },
    startTime: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true },
);

studentNoteSchema.index({ tenantId: 1, studentId: 1, date: -1 });
// Index for fast reminder queries: notes with a startTime that haven't expired
studentNoteSchema.index({ tenantId: 1, startTime: 1, endDate: 1 });

export const StudentNoteModel = mongoose.model<IStudentNoteDocument>(
  'StudentNote',
  studentNoteSchema,
);
