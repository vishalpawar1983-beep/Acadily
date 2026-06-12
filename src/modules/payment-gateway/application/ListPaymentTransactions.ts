import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentTransactionRepository } from '../domain/repositories/IPaymentTransactionRepository.js';

export interface ListPaymentTransactionsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  status?: string;
  studentId?: string;
}

export interface ListPaymentTransactionsResponse {
  transactions: Array<{
    id: string;
    transactionId: string;
    studentId: string;
    amount: number;
    status: string;
    paymentGateway: string;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListPaymentTransactions implements UseCase<ListPaymentTransactionsRequest, ListPaymentTransactionsResponse> {
  constructor(private readonly repo: IPaymentTransactionRepository) {}

  async execute(request: ListPaymentTransactionsRequest): Promise<ListPaymentTransactionsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { transactions, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      status: request.status,
      studentId: request.studentId,
    });

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        transactionId: t.transactionId,
        studentId: t.studentId,
        amount: t.amount,
        status: t.status,
        paymentGateway: t.paymentGateway,
        courseId: t.courseId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
