import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { ValidationError } from '../../../../shared/domain/errors.js';

export type AttendanceStatus = 'P' | 'A';

export interface StudentRecord {
  studentId: string;
  days: Record<string, AttendanceStatus>;
}

interface AttendanceProps {
  tenantId: string;
  batchId: string;
  month: number; // 0-11
  year: number;
  records: StudentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceInput {
  tenantId: string;
  batchId: string;
  month: number;
  year: number;
}

export class Attendance extends AggregateRoot<AttendanceProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get batchId(): string {
    return this.props.batchId;
  }
  get month(): number {
    return this.props.month;
  }
  get year(): number {
    return this.props.year;
  }
  get records(): ReadonlyArray<StudentRecord> {
    return this.props.records;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAttendance(studentId: string, day: number, status: AttendanceStatus): void {
    if (day < 1 || day > 31) {
      throw new ValidationError(`Invalid day: ${day}. Must be between 1 and 31.`);
    }
    if (status !== 'P' && status !== 'A') {
      throw new ValidationError(`Invalid status: ${status}. Must be "P" or "A".`);
    }

    let record = this.props.records.find((r) => r.studentId === studentId);
    if (!record) {
      record = { studentId, days: {} };
      this.props.records.push(record);
    }

    record.days[String(day)] = status;
    this.props.updatedAt = new Date();
  }

  getStudentAttendance(studentId: string): StudentRecord | null {
    return this.props.records.find((r) => r.studentId === studentId) ?? null;
  }

  static create(input: CreateAttendanceInput, id?: string): Attendance {
    if (input.month < 0 || input.month > 11) {
      throw new ValidationError(`Invalid month: ${input.month}. Must be between 0 and 11.`);
    }

    return new Attendance(
      {
        tenantId: input.tenantId,
        batchId: input.batchId,
        month: input.month,
        year: input.year,
        records: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(
    id: string,
    props: {
      tenantId: string;
      batchId: string;
      month: number;
      year: number;
      records: StudentRecord[];
      createdAt: Date;
      updatedAt: Date;
    },
  ): Attendance {
    return new Attendance(
      {
        tenantId: props.tenantId,
        batchId: props.batchId,
        month: props.month,
        year: props.year,
        records: props.records,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
