import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentAttendanceSubdoc {
  student: string;
  days: Map<string, string>;
}

export interface IAttendanceDocument extends Document {
  tenantId: string;
  batch: string;
  month: number;
  year: number;
  students: IStudentAttendanceSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const studentAttendanceSchema = new Schema<IStudentAttendanceSubdoc>(
  {
    student: { type: String, required: true },
    days: {
      type: Map,
      of: { type: String, enum: ['P', 'A'] },
      default: () => new Map(),
    },
  },
  { _id: false },
);

const attendanceSchema = new Schema<IAttendanceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    batch: { type: String, required: true },
    month: { type: Number, required: true, min: 0, max: 11 },
    year: { type: Number, required: true },
    students: { type: [studentAttendanceSchema], default: [] },
  },
  { timestamps: true },
);

attendanceSchema.index({ tenantId: 1, batch: 1, month: 1, year: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, 'students.student': 1 });

export const AttendanceModel = mongoose.model<IAttendanceDocument>('Attendance', attendanceSchema);
