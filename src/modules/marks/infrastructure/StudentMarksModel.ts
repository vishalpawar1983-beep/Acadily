import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectMarkDoc {
  subjectName: string;
  subjectCode: string;
  theory: number | null;
  practical: number | null;
  totalMarks: number | null;
  isActive: boolean;
}

export interface IStudentMarksDocument extends Document {
  tenantId: string;
  studentId: string;
  courseId: string;
  subjects: ISubjectMarkDoc[];
  resultStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectMarkSchema = new Schema<ISubjectMarkDoc>(
  {
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    theory: { type: Number, default: null },
    practical: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const studentMarksSchema = new Schema<IStudentMarksDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    courseId: { type: String, required: true },
    subjects: [subjectMarkSchema],
    resultStatus: {
      type: String,
      enum: ['NotStarted', 'InProgress', 'Completed'],
      default: 'NotStarted',
    },
  },
  { timestamps: true },
);

studentMarksSchema.index({ tenantId: 1, studentId: 1, courseId: 1 }, { unique: true });

export const StudentMarksModel = mongoose.model<IStudentMarksDocument>('StudentMarks', studentMarksSchema);
