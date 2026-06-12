import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface CommissionProps {
  tenantId: string;
  studentName: string;
  commissionPersonName: string;
  voucherNumber: string;
  commissionAmount: number;
  commissionPaid: number;
  commissionRemaining: number;
  commissionDate: Date;
  narration: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommissionInput {
  tenantId: string;
  studentName: string;
  commissionPersonName: string;
  voucherNumber?: string;
  commissionAmount: number;
  commissionPaid: number;
  commissionDate: string;
  narration?: string;
}

export class Commission extends AggregateRoot<CommissionProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentName(): string {
    return this.props.studentName;
  }
  get commissionPersonName(): string {
    return this.props.commissionPersonName;
  }
  get voucherNumber(): string {
    return this.props.voucherNumber;
  }
  get commissionAmount(): number {
    return this.props.commissionAmount;
  }
  get commissionPaid(): number {
    return this.props.commissionPaid;
  }
  get commissionRemaining(): number {
    return this.props.commissionRemaining;
  }
  get commissionDate(): Date {
    return this.props.commissionDate;
  }
  get narration(): string {
    return this.props.narration;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    studentName?: string;
    commissionPersonName?: string;
    voucherNumber?: string;
    commissionAmount?: number;
    commissionPaid?: number;
    commissionDate?: Date;
    narration?: string;
  }): void {
    if (input.studentName !== undefined) this.props.studentName = input.studentName;
    if (input.commissionPersonName !== undefined) this.props.commissionPersonName = input.commissionPersonName;
    if (input.voucherNumber !== undefined) this.props.voucherNumber = input.voucherNumber;
    if (input.commissionAmount !== undefined) this.props.commissionAmount = input.commissionAmount;
    if (input.commissionPaid !== undefined) this.props.commissionPaid = input.commissionPaid;
    if (input.commissionDate !== undefined) this.props.commissionDate = input.commissionDate;
    if (input.narration !== undefined) this.props.narration = input.narration;
    this.props.commissionRemaining = this.props.commissionAmount - this.props.commissionPaid;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateCommissionInput, id?: string): Commission {
    const commissionAmount = input.commissionAmount;
    const commissionPaid = input.commissionPaid;
    return new Commission(
      {
        tenantId: input.tenantId,
        studentName: input.studentName,
        commissionPersonName: input.commissionPersonName,
        voucherNumber: input.voucherNumber ?? '',
        commissionAmount,
        commissionPaid,
        commissionRemaining: commissionAmount - commissionPaid,
        commissionDate: new Date(input.commissionDate),
        narration: input.narration ?? '',
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
      studentName: string;
      commissionPersonName: string;
      voucherNumber: string;
      commissionAmount: number;
      commissionPaid: number;
      commissionRemaining: number;
      commissionDate: Date;
      narration: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Commission {
    return new Commission(props, id);
  }
}
