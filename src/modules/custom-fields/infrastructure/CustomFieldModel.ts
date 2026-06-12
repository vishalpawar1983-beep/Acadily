import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomFieldDocument extends Document {
  tenantId: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  mandatory: boolean;
  defaultValue?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const customFieldSchema = new Schema<ICustomFieldDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    fieldName: { type: String, required: true },
    fieldType: {
      type: String,
      required: true,
      enum: ['text', 'number', 'select', 'date', 'checkbox', 'email', 'textarea', 'radio', 'url', 'currency'],
    },
    options: [{ type: String }],
    mandatory: { type: Boolean, default: false },
    defaultValue: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

customFieldSchema.index({ tenantId: 1, fieldName: 1 }, { unique: true });

export const CustomFieldModel = mongoose.model<ICustomFieldDocument>(
  'CustomField',
  customFieldSchema,
);
