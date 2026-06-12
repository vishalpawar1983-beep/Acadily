import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export type PaymentStatus = 'pending' | 'success' | 'failure';
export type PaymentGateway = 'easebuzz';

interface PaymentTransactionProps {
  tenantId: string;
  transactionId: string;
  studentId: string;
  amount: number;
  status: PaymentStatus;
  paymentGateway: PaymentGateway;
  gatewayResponse: Record<string, unknown>;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentTransactionInput {
  tenantId: string;
  studentId: string;
  amount: number;
  courseId: string;
  paymentGateway?: PaymentGateway;
}

export class PaymentTransaction extends AggregateRoot<PaymentTransactionProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get transactionId(): string {
    return this.props.transactionId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get paymentGateway(): PaymentGateway {
    return this.props.paymentGateway;
  }
  get gatewayResponse(): Record<string, unknown> {
    return { ...this.props.gatewayResponse };
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markSuccess(gatewayResponse: Record<string, unknown>): void {
    this.props.status = 'success';
    this.props.gatewayResponse = gatewayResponse;
    this.props.updatedAt = new Date();
  }

  markFailure(gatewayResponse: Record<string, unknown>): void {
    this.props.status = 'failure';
    this.props.gatewayResponse = gatewayResponse;
    this.props.updatedAt = new Date();
  }

  private static generateTransactionId(): string {
    return `Txn${Date.now()}`;
  }

  static create(input: CreatePaymentTransactionInput, id?: string): PaymentTransaction {
    return new PaymentTransaction(
      {
        tenantId: input.tenantId,
        transactionId: PaymentTransaction.generateTransactionId(),
        studentId: input.studentId,
        amount: input.amount,
        status: 'pending',
        paymentGateway: input.paymentGateway ?? 'easebuzz',
        gatewayResponse: {},
        courseId: input.courseId,
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
      transactionId: string;
      studentId: string;
      amount: number;
      status: PaymentStatus;
      paymentGateway: PaymentGateway;
      gatewayResponse: Record<string, unknown>;
      courseId: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): PaymentTransaction {
    return new PaymentTransaction(props, id);
  }
}
