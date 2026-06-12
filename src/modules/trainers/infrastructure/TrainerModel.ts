import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainerDocument extends Document {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const trainerSchema = new Schema<ITrainerDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    specialization: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

trainerSchema.index({ tenantId: 1 });
trainerSchema.index(
  { tenantId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null } } },
);

export const TrainerModel = mongoose.model<ITrainerDocument>('Trainer', trainerSchema);
