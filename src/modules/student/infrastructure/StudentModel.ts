import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentDocument extends Document {
  tenantId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  contact: {
    mobile: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  dateOfBirth?: Date;
  educationQualification?: string;
  enrollment: {
    courseId: string;
    courseName: string;
    courseFees: number;
    discount: number;
    netFees: number;
    remainingFees: number;
    totalPaid: number;
    downPayment: number;
    dateOfJoining: Date;
    installmentCount: number;
    installmentAmount: number;
    companyId?: string;
    companyName?: string;
  };
  status: string;
  image?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudentDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    rollNumber: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fatherName: { type: String },
    contact: {
      mobile: { type: String, required: true },
      phone: { type: String },
      email: { type: String },
      address: { type: String },
      city: { type: String },
    },
    dateOfBirth: { type: Date },
    educationQualification: { type: String },
    enrollment: {
      courseId: { type: String, required: true },
      courseName: { type: String, required: true },
      courseFees: { type: Number, required: true, default: 0 },
      discount: { type: Number, default: 0 },
      netFees: { type: Number, required: true, default: 0 },
      remainingFees: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      downPayment: { type: Number, default: 0 },
      dateOfJoining: { type: Date, required: true },
      installmentCount: { type: Number, default: 0 },
      installmentAmount: { type: Number, default: 0 },
      companyId: { type: String },
      companyName: { type: String },
    },
    status: {
      type: String,
      enum: ['active', 'dropout', 'completed', 'suspended'],
      default: 'active',
    },
    image: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

studentSchema.index({ tenantId: 1, rollNumber: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, status: 1 });

export const StudentModel = mongoose.model<IStudentDocument>('Student', studentSchema);
