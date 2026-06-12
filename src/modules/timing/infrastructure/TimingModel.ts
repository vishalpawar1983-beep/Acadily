import mongoose, { Schema, Document } from 'mongoose';

export interface ITimingDocument extends Document {
  tenantId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timingSchema = new Schema<ITimingDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

timingSchema.index({ tenantId: 1, startTime: 1, endTime: 1 }, { unique: true });

export const TimingModel = mongoose.model<ITimingDocument>('Timing', timingSchema);
