import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

type IssueStatus = 'open' | 'inProgress' | 'resolved' | 'closed';

interface StudentIssueProps {
  tenantId: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  showOnDashboard: boolean;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentIssueInput {
  tenantId: string;
  studentId: string;
  date?: string;
  particulars: string;
  addedBy: string;
  showOnDashboard?: boolean;
  status?: IssueStatus;
}

export class StudentIssue extends AggregateRoot<StudentIssueProps> {
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
  get showOnDashboard(): boolean {
    return this.props.showOnDashboard;
  }
  get status(): IssueStatus {
    return this.props.status;
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
    showOnDashboard?: boolean;
    status?: IssueStatus;
  }): void {
    if (input.particulars !== undefined) this.props.particulars = input.particulars;
    if (input.date !== undefined) this.props.date = input.date;
    if (input.showOnDashboard !== undefined) this.props.showOnDashboard = input.showOnDashboard;
    if (input.status !== undefined) this.props.status = input.status;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateStudentIssueInput, id?: string): StudentIssue {
    return new StudentIssue(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        date: input.date ? new Date(input.date) : new Date(),
        particulars: input.particulars,
        addedBy: input.addedBy,
        showOnDashboard: input.showOnDashboard ?? false,
        status: input.status ?? 'open',
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
      showOnDashboard: boolean;
      status: IssueStatus;
      createdAt: Date;
      updatedAt: Date;
    },
  ): StudentIssue {
    return new StudentIssue(props, id);
  }
}
