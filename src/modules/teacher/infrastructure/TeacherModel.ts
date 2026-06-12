import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherDocument extends Document {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  qualification: string;
  experience: number;
  address: string;
  isActive: boolean;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacherDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subjects: [{ type: String }],
    qualification: { type: String, required: true },
    experience: { type: Number, default: 0 },
    address: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    joiningDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

teacherSchema.index({ tenantId: 1, email: 1 }, { unique: true });
teacherSchema.index({ tenantId: 1, isActive: 1 });

export const TeacherModel = mongoose.model<ITeacherDocument>('Teacher', teacherSchema);
