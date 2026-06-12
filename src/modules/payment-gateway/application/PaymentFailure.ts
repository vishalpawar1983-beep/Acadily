import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentTransactionRepository } from '../domain/repositories/IPaymentTransactionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface PaymentFailureRequest {
  tenantId: string;
  transactionId: string;
  gatewayResponse: Record<string, unknown>;
}

export interface PaymentFailureResponse {
  id: string;
  transactionId: string;
  studentId: string;
  amount: number;
  status: string;
  courseId: string;
  updatedAt: Date;
}

export class PaymentFailure implements UseCase<PaymentFailureRequest, PaymentFailureResponse> {
  constructor(private readonly repo: IPaymentTransactionRepository) {}

  async execute(request: PaymentFailureRequest): Promise<PaymentFailureResponse> {
    const transaction = await this.repo.findByTransactionId(request.tenantId, request.transactionId);
    if (!transaction) {
      throw new NotFoundError('PaymentTransaction', request.transactionId);
    }

    transaction.markFailure(request.gatewayResponse);
    const updated = await this.repo.update(transaction);

    return {
      id: updated.id,
      transactionId: updated.transactionId,
      studentId: updated.studentId,
      amount: updated.amount,
      status: updated.status,
      courseId: updated.courseId,
      updatedAt: updated.updatedAt,
    };
  }
}
