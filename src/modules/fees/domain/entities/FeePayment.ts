import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface FeePaymentProps {
  tenantId: string;
  studentId: string;
  courseId: string;
  netCourseFees: number;
  remainingFees: number;
  amountPaid: number;
  receiptNumber: string;
  paymentMethod: string;
  narration?: string;
  lateFees: number;
  gstPercentage: number;
  addedBy: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeePaymentInput {
  tenantId: string;
  studentId: string;
  courseId: string;
  netCourseFees: number;
  remainingFees: number;
  amountPaid: number;
  receiptNumber: string;
  paymentMethod: string;
  narration?: string;
  lateFees?: number;
  gstPercentage: number;
  addedBy: string;
  paymentDate?: Date;
}

export class FeePayment extends AggregateRoot<FeePaymentProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get netCourseFees(): number {
    return this.props.netCourseFees;
  }
  get remainingFees(): number {
    return this.props.remainingFees;
  }
  get amountPaid(): number {
    return this.props.amountPaid;
  }
  get receiptNumber(): string {
    return this.props.receiptNumber;
  }
  get paymentMethod(): string {
    return this.props.paymentMethod;
  }
  get narration(): string | undefined {
    return this.props.narration;
  }
  get lateFees(): number {
    return this.props.lateFees;
  }
  get gstPercentage(): number {
    return this.props.gstPercentage;
  }
  get addedBy(): string {
    return this.props.addedBy;
  }
  get paymentDate(): Date {
    return this.props.paymentDate;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: CreateFeePaymentInput, id?: string): FeePayment {
    return new FeePayment(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        courseId: input.courseId,
        netCourseFees: input.netCourseFees,
        remainingFees: input.remainingFees,
        amountPaid: input.amountPaid,
        receiptNumber: input.receiptNumber,
        paymentMethod: input.paymentMethod,
        narration: input.narration,
        lateFees: input.lateFees ?? 0,
        gstPercentage: input.gstPercentage,
        addedBy: input.addedBy,
        paymentDate: input.paymentDate ?? new Date(),
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
      netCourseFees: number;
      remainingFees: number;
      amountPaid: number;
      receiptNumber: string;
      paymentMethod: string;
      narration?: string;
      lateFees: number;
      gstPercentage: number;
      addedBy: string;
      paymentDate: Date;
      createdAt: Date;
      updatedAt: Date;
    },
  ): FeePayment {
    return new FeePayment(props, id);
  }
}
