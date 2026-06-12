import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';
import { FeeInstallment } from '../domain/entities/FeeInstallment.js';

export interface CreateInstallmentRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
  installmentNumber: number;
  installmentAmount: number;
  dueDate: string;
}

export interface CreateInstallmentResponse {
  id: string;
  studentId: string;
  courseId: string;
  installmentNumber: number;
  installmentAmount: number;
  dueDate: Date;
  isPaid: boolean;
  isDropout: boolean;
  createdAt: Date;
}

export class CreateInstallment implements UseCase<CreateInstallmentRequest, CreateInstallmentResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: CreateInstallmentRequest): Promise<CreateInstallmentResponse> {
    const installment = FeeInstallment.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      courseId: request.courseId,
      installmentNumber: request.installmentNumber,
      installmentAmount: request.installmentAmount,
      dueDate: request.dueDate,
    });

    const saved = await this.installmentRepo.save(installment);

    return {
      id: saved.id,
      studentId: saved.studentId,
      courseId: saved.courseId,
      installmentNumber: saved.installmentNumber,
      installmentAmount: saved.installmentAmount,
      dueDate: saved.dueDate,
      isPaid: saved.isPaid,
      isDropout: saved.isDropout,
      createdAt: saved.createdAt,
    };
  }
}
