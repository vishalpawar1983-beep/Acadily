import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionFormDocument extends Document {
  tenantId: string;
  studentId: string;
  formData: Record<string, unknown>;
  companyId: string;
  showNotesDashBoard: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const admissionFormSchema = new Schema<IAdmissionFormDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    formData: { type: Schema.Types.Mixed, default: {} },
    companyId: { type: String, required: true },
    showNotesDashBoard: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

admissionFormSchema.index({ tenantId: 1, studentId: 1 });

export const AdmissionFormModel = mongoose.model<IAdmissionFormDocument>(
  'AdmissionForm',
  admissionFormSchema,
);
