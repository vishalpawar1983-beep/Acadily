import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectDocument {
  name: string;
  code: string;
  fullMarks: number;
  passMarks: number;
  semester: number;
}

export interface ICourseDocument extends Document {
  tenantId: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects: ISubjectDocument[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubjectDocument>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    fullMarks: { type: Number, required: true },
    passMarks: { type: Number, required: true },
    semester: { type: Number, required: true },
  },
  { _id: false },
);

const courseSchema = new Schema<ICourseDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    fees: { type: Number, required: true },
    courseType: { type: String, required: true },
    durationYears: { type: Number, required: true },
    category: { type: String, required: true },
    subjects: { type: [subjectSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

courseSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const CourseModel = mongoose.model<ICourseDocument>('Course', courseSchema);
