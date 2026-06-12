import mongoose, { Schema, Document } from 'mongoose';
import { ROLES } from '../domain/value-objects/Role.js';

export interface IUserDocument extends Document {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  refreshToken?: string;
  otp?: string;
  otpExpiresAt?: Date;
  isOtpVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ROLES, default: 'Student' },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    isOtpVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
