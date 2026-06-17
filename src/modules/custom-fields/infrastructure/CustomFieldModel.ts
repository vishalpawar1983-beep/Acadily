import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomFieldDocument extends Document {
  tenantId: string;
  companyId?: string;
  formType: 'admission' | 'enquiry';
  formId?: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  mandatory: boolean;
  defaultValue?: string;
  order: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const customFieldSchema = new Schema<ICustomFieldDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    companyId: { type: String, index: true },
    formType: { type: String, enum: ['admission', 'enquiry'], default: 'admission', index: true },
    formId: { type: String, index: true },
    fieldName: { type: String, required: true },
    fieldType: {
      type: String,
      required: true,
      enum: ['text', 'number', 'select', 'date', 'checkbox', 'email', 'textarea', 'radio', 'url', 'currency'],
    },
    options: [{ type: String }],
    mandatory: { type: Boolean, default: false },
    defaultValue: { type: String },
    // Display order within a (company + formType + formId) scope. New/unordered
    // fields default high so they append at the end until explicitly reordered.
    order: { type: Number, default: 1000000, index: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

// Scope queries by tenant + company. Uniqueness of fieldName within a company is
// enforced at the application layer (CreateCustomField) — not as a DB unique index,
// since pre-existing migrated fields without a companyId would otherwise collide.
customFieldSchema.index({ tenantId: 1, companyId: 1 });

export const CustomFieldModel = mongoose.model<ICustomFieldDocument>(
  'CustomField',
  customFieldSchema,
);
