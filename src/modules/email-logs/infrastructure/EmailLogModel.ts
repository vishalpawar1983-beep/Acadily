import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLogDocument extends Document {
  tenantId: string;
  recipients: string[];
  subject: string;
  content: string;
  sender: string;
  sentAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLogDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    recipients: [{ type: String }],
    subject: { type: String, required: true },
    content: { type: String, default: '' },
    sender: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, default: 'sent' },
  },
  { timestamps: true },
);

emailLogSchema.index({ tenantId: 1, sentAt: -1 });

export const EmailLogModel = mongoose.model<IEmailLogDocument>('EmailLog', emailLogSchema);
