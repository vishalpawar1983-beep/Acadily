import mongoose, { Schema, Document } from 'mongoose';

export interface IBatchStudentSubjectDocument {
  subjectName: string;
  status: 'notStarted' | 'inProgress' | 'completed';
  progress: number;
  startDate?: Date;
  completionDate?: Date;
  notes?: string;
}

export interface IBatchStudentDocument {
  studentId: string;
  subjects: IBatchStudentSubjectDocument[];
  currentSoftware?: string;
}

export interface IBatchDocument extends Document {
  tenantId: string;
  name: string;
  courseCategory: string;
  course: string;
  trainer: string;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate?: Date;
  status: 'completed' | 'inProgress';
  students: IBatchStudentDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchStudentSubjectSchema = new Schema<IBatchStudentSubjectDocument>(
  {
    subjectName: { type: String, required: true },
    status: {
      type: String,
      enum: ['notStarted', 'inProgress', 'completed'],
      default: 'notStarted',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date },
    completionDate: { type: Date },
    notes: { type: String },
  },
  { _id: false },
);

const batchStudentSchema = new Schema<IBatchStudentDocument>(
  {
    studentId: { type: String, required: true },
    subjects: [batchStudentSubjectSchema],
    currentSoftware: { type: String },
  },
  { _id: false },
);

const batchSchema = new Schema<IBatchDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    courseCategory: { type: String, default: '' },
    course: { type: String, default: '' },
    trainer: { type: String, default: '' },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['completed', 'inProgress'],
      default: 'inProgress',
    },
    students: [batchStudentSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

batchSchema.index({ tenantId: 1, name: 1 }, { unique: true });
batchSchema.index({ tenantId: 1, isActive: 1 });
batchSchema.index({ tenantId: 1, status: 1 });

export const BatchModel = mongoose.model<IBatchDocument>('Batch', batchSchema);
