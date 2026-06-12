import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseCompletionDocument extends Document {
  tenantId: string;
  studentId: string;
  courseId: string;
  completionDate: Date;
  certificateNumber: string | null;
  remarks: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseCompletionSchema = new Schema<ICourseCompletionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    courseId: { type: String, required: true },
    completionDate: { type: Date, default: Date.now },
    certificateNumber: { type: String, default: null },
    remarks: { type: String, default: null },
    status: {
      type: String,
      enum: ['completed', 'withdrawn', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true },
);

courseCompletionSchema.index({ tenantId: 1, studentId: 1, courseId: 1 }, { unique: true });

export const CourseCompletionModel = mongoose.model<ICourseCompletionDocument>('CourseCompletion', courseCompletionSchema);
