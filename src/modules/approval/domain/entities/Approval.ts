import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface ApprovalProps {
  tenantId: string;
  receiptId: string;
  studentId: string;
  status: ApprovalStatus;
  reviewedBy: string;
  reviewedAt: Date | null;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApprovalInput {
  tenantId: string;
  receiptId: string;
  studentId: string;
  status?: ApprovalStatus;
  remarks?: string;
}

export class Approval extends AggregateRoot<ApprovalProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get receiptId(): string {
    return this.props.receiptId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get status(): ApprovalStatus {
    return this.props.status;
  }
  get reviewedBy(): string {
    return this.props.reviewedBy;
  }
  get reviewedAt(): Date | null {
    return this.props.reviewedAt;
  }
  get remarks(): string {
    return this.props.remarks;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  review(input: {
    status: 'approved' | 'rejected';
    reviewedBy: string;
    remarks?: string;
  }): void {
    this.props.status = input.status;
    this.props.reviewedBy = input.reviewedBy;
    this.props.reviewedAt = new Date();
    if (input.remarks !== undefined) this.props.remarks = input.remarks;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateApprovalInput, id?: string): Approval {
    return new Approval(
      {
        tenantId: input.tenantId,
        receiptId: input.receiptId,
        studentId: input.studentId,
        status: input.status ?? 'pending',
        reviewedBy: '',
        reviewedAt: null,
        remarks: input.remarks ?? '',
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
      receiptId: string;
      studentId: string;
      status: ApprovalStatus;
      reviewedBy: string;
      reviewedAt: Date | null;
      remarks: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Approval {
    return new Approval(props, id);
  }
}
