import mongoose, { Schema, Document } from 'mongoose';

export interface IFormDefinitionDocument extends Document {
  tenantId: string;
  formName: string;
  fields: Array<{
    name: string;
    type: string;
    options?: Array<{ label: string; value: string }>;
    mandatory: boolean;
    headerView: boolean;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const formFieldSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'checkbox', 'radio', 'select', 'number', 'email', 'date', 'datetime-local', 'url', 'currency', 'textarea'],
    },
    options: [
      {
        label: { type: String },
        value: { type: String },
      },
    ],
    mandatory: { type: Boolean, default: false },
    headerView: { type: Boolean, default: false },
  },
  { _id: false },
);

const formDefinitionSchema = new Schema<IFormDefinitionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    formName: { type: String, required: true },
    fields: [formFieldSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

formDefinitionSchema.index({ tenantId: 1, formName: 1 }, { unique: true });

export const FormDefinitionModel = mongoose.model<IFormDefinitionDocument>(
  'FormDefinition',
  formDefinitionSchema,
);

export interface IFormSubmissionDocument extends Document {
  tenantId: string;
  formId: string;
  values: Array<{
    fieldName: string;
    fieldType: string;
    value: unknown;
  }>;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const formSubmissionSchema = new Schema<IFormSubmissionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    formId: { type: String, required: true },
    values: [
      {
        fieldName: { type: String, required: true },
        fieldType: { type: String, required: true },
        value: { type: Schema.Types.Mixed },
      },
    ],
    addedBy: { type: String, required: true },
  },
  { timestamps: true },
);

formSubmissionSchema.index({ tenantId: 1, formId: 1 });

export const FormSubmissionModel = mongoose.model<IFormSubmissionDocument>(
  'FormSubmission',
  formSubmissionSchema,
);

export interface IDefaultSelectDocument extends Document {
  tenantId: string;
  selectName: string;
  options: string[];
  mandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultSelectSchema = new Schema<IDefaultSelectDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    selectName: { type: String, required: true },
    options: [{ type: String }],
    mandatory: { type: Boolean, default: false },
  },
  { timestamps: true },
);

defaultSelectSchema.index({ tenantId: 1, selectName: 1 }, { unique: true });

export const DefaultSelectModel = mongoose.model<IDefaultSelectDocument>(
  'DefaultSelect',
  defaultSelectSchema,
);
