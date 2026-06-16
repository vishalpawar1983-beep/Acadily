import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplateDocument extends Document {
  tenantId: string;
  templateName: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplateDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    templateName: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  // Dedicated collection so user-defined custom templates are fully isolated from
  // the fixed `emailtemplates` collection (the legacy over-due/cancellation templates).
  { timestamps: true, collection: 'customemailtemplates' },
);

emailTemplateSchema.index({ tenantId: 1, templateName: 1 }, { unique: true });

export const EmailTemplateModel = mongoose.model<IEmailTemplateDocument>(
  'EmailTemplate',
  emailTemplateSchema,
);
