import type { PaymentTransaction } from '../entities/PaymentTransaction.js';

export interface FindAllPaymentTransactionsOptions {
  skip?: number;
  limit?: number;
  status?: string;
  studentId?: string;
}

export interface IPaymentTransactionRepository {
  findById(tenantId: string, id: string): Promise<PaymentTransaction | null>;
  findByTransactionId(tenantId: string, transactionId: string): Promise<PaymentTransaction | null>;
  findAll(
    tenantId: string,
    options?: FindAllPaymentTransactionsOptions,
  ): Promise<{ transactions: PaymentTransaction[]; total: number }>;
  save(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  update(transaction: PaymentTransaction): Promise<PaymentTransaction>;
}
