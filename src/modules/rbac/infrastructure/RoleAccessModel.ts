import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleAccessDocument extends Document {
  tenantId: string;
  role: string;
  permissions: Map<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleAccessSchema = new Schema<IRoleAccessDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    role: {
      type: String,
      required: true,
      enum: ['Student', 'Telecaller', 'Accounts', 'Counsellor', 'Admin', 'SuperAdmin', 'Trainer'],
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: {},
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roleAccessSchema.index({ tenantId: 1, role: 1 }, { unique: true });

export const RoleAccessModel = mongoose.model<IRoleAccessDocument>('RoleAccess', roleAccessSchema);
