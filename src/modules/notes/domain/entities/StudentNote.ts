import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface StudentNoteProps {
  tenantId: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  startTime: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentNoteInput {
  tenantId: string;
  studentId: string;
  date?: string;
  particulars: string;
  addedBy?: string;
  startTime?: string;
  endDate?: string;
}

export class StudentNote extends AggregateRoot<StudentNoteProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get date(): Date {
    return this.props.date;
  }
  get particulars(): string {
    return this.props.particulars;
  }
  get addedBy(): string {
    return this.props.addedBy;
  }
  get startTime(): Date | null {
    return this.props.startTime;
  }
  get endDate(): Date | null {
    return this.props.endDate;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    particulars?: string;
    date?: Date;
    startTime?: Date | null;
    endDate?: Date | null;
  }): void {
    if (input.particulars !== undefined) this.props.particulars = input.particulars;
    if (input.date !== undefined) this.props.date = input.date;
    if (input.startTime !== undefined) this.props.startTime = input.startTime;
    if (input.endDate !== undefined) this.props.endDate = input.endDate;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateStudentNoteInput, id?: string): StudentNote {
    return new StudentNote(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        date: input.date ? new Date(input.date) : new Date(),
        particulars: input.particulars,
        addedBy: input.addedBy ?? '',
        startTime: input.startTime ? new Date(input.startTime) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
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
      studentId: string;
      date: Date;
      particulars: string;
      addedBy: string;
      startTime: Date | null;
      endDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): StudentNote {
    return new StudentNote(props, id);
  }
}
