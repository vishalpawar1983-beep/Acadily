import type { FeeInstallment } from '../entities/FeeInstallment.js';

export interface FindAllInstallmentsOptions {
  skip?: number;
  limit?: number;
  studentId?: string;
  courseId?: string;
  isPaid?: boolean;
}

export interface IFeeInstallmentRepository {
  findById(tenantId: string, id: string): Promise<FeeInstallment | null>;
  findByStudent(tenantId: string, studentId: string): Promise<FeeInstallment[]>;
  findByStudentAndCourse(tenantId: string, studentId: string, courseId: string): Promise<FeeInstallment[]>;
  findOverdue(tenantId: string): Promise<FeeInstallment[]>;
  findAll(
    tenantId: string,
    options?: FindAllInstallmentsOptions,
  ): Promise<{ installments: FeeInstallment[]; total: number }>;
  save(installment: FeeInstallment): Promise<FeeInstallment>;
  update(installment: FeeInstallment): Promise<FeeInstallment>;
}
