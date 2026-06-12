import mongoose, { Schema, Document } from 'mongoose';

export interface INumberOfYearsDocument extends Document {
  tenantId: string;
  value: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const numberOfYearsSchema = new Schema<INumberOfYearsDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

numberOfYearsSchema.index({ tenantId: 1, value: 1 }, { unique: true });

export const NumberOfYearsModel = mongoose.model<INumberOfYearsDocument>('NumberOfYears', numberOfYearsSchema);
