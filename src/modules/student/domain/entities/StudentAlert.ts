import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export type AlertStatus = 'pending' | 'sent' | 'dismissed';

interface StudentAlertProps {
  tenantId: string;
  studentId?: string;
  date: Date;
  reminderDateTime: Date;
  status: AlertStatus;
  particulars: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentAlertInput {
  tenantId: string;
  studentId?: string;
  date: Date;
  reminderDateTime: Date;
  status?: AlertStatus;
  particulars: string;
  createdBy: string;
}

export class StudentAlert extends AggregateRoot<StudentAlertProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string | undefined {
    return this.props.studentId;
  }
  get date(): Date {
    return this.props.date;
  }
  get reminderDateTime(): Date {
    return this.props.reminderDateTime;
  }
  get status(): AlertStatus {
    return this.props.status;
  }
  get particulars(): string {
    return this.props.particulars;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    date?: Date;
    reminderDateTime?: Date;
    status?: AlertStatus;
    particulars?: string;
  }): void {
    if (input.date !== undefined) this.props.date = input.date;
    if (input.reminderDateTime !== undefined) this.props.reminderDateTime = input.reminderDateTime;
    if (input.status !== undefined) this.props.status = input.status;
    if (input.particulars !== undefined) this.props.particulars = input.particulars;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateStudentAlertInput, id?: string): StudentAlert {
    return new StudentAlert(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        date: input.date,
        reminderDateTime: input.reminderDateTime,
        status: input.status ?? 'pending',
        particulars: input.particulars,
        createdBy: input.createdBy,
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
      studentId?: string;
      date: Date;
      reminderDateTime: Date;
      status: AlertStatus;
      particulars: string;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): StudentAlert {
    return new StudentAlert(props, id);
  }
}
