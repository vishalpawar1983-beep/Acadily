import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseTypeDocument extends Document {
  tenantId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseTypeSchema = new Schema<ICourseTypeDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

courseTypeSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const CourseTypeModel = mongoose.model<ICourseTypeDocument>('CourseType', courseTypeSchema);
