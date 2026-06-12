import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { ValidationError } from '../../../../shared/domain/errors.js';

interface FeeInstallmentProps {
  tenantId: string;
  studentId: string;
  courseId: string;
  installmentNumber: number;
  installmentAmount: number;
  dueDate: Date;
  paidDate: Date | null;
  isPaid: boolean;
  isDropout: boolean;
  lateFeeAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeeInstallmentInput {
  tenantId: string;
  studentId: string;
  courseId: string;
  installmentNumber: number;
  installmentAmount: number;
  dueDate: string;
}

export class FeeInstallment extends AggregateRoot<FeeInstallmentProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get installmentNumber(): number {
    return this.props.installmentNumber;
  }
  get installmentAmount(): number {
    return this.props.installmentAmount;
  }
  get dueDate(): Date {
    return this.props.dueDate;
  }
  get paidDate(): Date | null {
    return this.props.paidDate;
  }
  get isPaid(): boolean {
    return this.props.isPaid;
  }
  get isDropout(): boolean {
    return this.props.isDropout;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get lateFeeAmount(): number {
    return this.props.lateFeeAmount;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  applyLateFee(amount: number): void {
    if (amount < 0) throw new ValidationError('Late fee amount cannot be negative');
    this.props.lateFeeAmount = amount;
    this.props.updatedAt = new Date();
  }

  calculateMonthsOverdue(): number {
    const now = new Date();
    if (now <= this.props.dueDate) return 0;
    const diffMs = now.getTime() - this.props.dueDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.ceil(diffDays / 30);
  }

  markPaid(paidDate?: Date): void {
    if (this.props.isPaid) {
      throw new ValidationError('Installment is already paid');
    }
    this.props.isPaid = true;
    this.props.paidDate = paidDate ?? new Date();
    this.props.lateFeeAmount = 0;
    this.props.updatedAt = new Date();
  }

  markDropout(): void {
    this.props.isDropout = true;
    this.props.updatedAt = new Date();
  }

  updateDetails(input: {
    installmentAmount?: number;
    dueDate?: Date;
  }): void {
    if (input.installmentAmount !== undefined) this.props.installmentAmount = input.installmentAmount;
    if (input.dueDate !== undefined) this.props.dueDate = input.dueDate;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateFeeInstallmentInput, id?: string): FeeInstallment {
    return new FeeInstallment(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        courseId: input.courseId,
        installmentNumber: input.installmentNumber,
        installmentAmount: input.installmentAmount,
        dueDate: new Date(input.dueDate),
        paidDate: null,
        isPaid: false,
        isDropout: false,
        lateFeeAmount: 0,
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
      courseId: string;
      installmentNumber: number;
      installmentAmount: number;
      dueDate: Date;
      paidDate: Date | null;
      isPaid: boolean;
      isDropout: boolean;
      lateFeeAmount: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ): FeeInstallment {
    return new FeeInstallment(props, id);
  }
}
