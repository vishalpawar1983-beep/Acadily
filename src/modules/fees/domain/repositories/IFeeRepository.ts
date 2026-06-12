import { FeePayment } from '../entities/FeePayment.js';

export interface IFeeRepository {
  findById(tenantId: string, id: string): Promise<FeePayment | null>;
  findByStudent(tenantId: string, studentId: string): Promise<FeePayment[]>;
  findAll(
    tenantId: string,
    options?: {
      skip?: number;
      limit?: number;
      studentId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ payments: FeePayment[]; total: number }>;
  save(payment: FeePayment): Promise<FeePayment>;
  update(tenantId: string, id: string, data: Partial<{
    amountPaid: number;
    narration: string;
    paymentDate: Date;
    lateFees: number;
    receiptNumber: string;
    remainingFees: number;
  }>): Promise<FeePayment>;
  delete(tenantId: string, id: string): Promise<void>;
  deleteByStudent(tenantId: string, studentId: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
