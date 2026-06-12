import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectDocument extends Document {
  tenantId: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId: string;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubjectDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    fullMarks: { type: Number, required: true },
    passMarks: { type: Number, required: true },
    semYear: { type: String, required: true },
    courseId: { type: String, default: '', index: true },
    addedBy: { type: String, required: true },
  },
  { timestamps: true },
);

subjectSchema.index({ tenantId: 1, courseId: 1 });
subjectSchema.index({ tenantId: 1, subjectCode: 1 });

export const SubjectModel = mongoose.model<ISubjectDocument>('Subject', subjectSchema);
