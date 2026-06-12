import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentTransactionRepository } from '../domain/repositories/IPaymentTransactionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetPaymentTransactionRequest {
  tenantId: string;
  id: string;
}

export interface GetPaymentTransactionResponse {
  id: string;
  transactionId: string;
  studentId: string;
  amount: number;
  status: string;
  paymentGateway: string;
  gatewayResponse: Record<string, unknown>;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetPaymentTransaction implements UseCase<GetPaymentTransactionRequest, GetPaymentTransactionResponse> {
  constructor(private readonly repo: IPaymentTransactionRepository) {}

  async execute(request: GetPaymentTransactionRequest): Promise<GetPaymentTransactionResponse> {
    const transaction = await this.repo.findById(request.tenantId, request.id);
    if (!transaction) {
      throw new NotFoundError('PaymentTransaction', request.id);
    }

    return {
      id: transaction.id,
      transactionId: transaction.transactionId,
      studentId: transaction.studentId,
      amount: transaction.amount,
      status: transaction.status,
      paymentGateway: transaction.paymentGateway,
      gatewayResponse: transaction.gatewayResponse,
      courseId: transaction.courseId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
