import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface IssueDashboardProps {
  tenantId: string;
  studentId: string;
  showStudent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertIssueDashboardInput {
  tenantId: string;
  studentId: string;
  showStudent: boolean;
}

export class IssueDashboard extends AggregateRoot<IssueDashboardProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get showStudent(): boolean {
    return this.props.showStudent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toggleShowStudent(show: boolean): void {
    this.props.showStudent = show;
    this.props.updatedAt = new Date();
  }

  static create(input: UpsertIssueDashboardInput, id?: string): IssueDashboard {
    return new IssueDashboard(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        showStudent: input.showStudent,
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
      showStudent: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): IssueDashboard {
    return new IssueDashboard(props, id);
  }
}
