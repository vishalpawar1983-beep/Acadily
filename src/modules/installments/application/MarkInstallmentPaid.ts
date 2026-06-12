import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';

export interface MarkInstallmentPaidRequest {
  tenantId: string;
  installmentId: string;
  paidDate?: string;
}

export interface MarkInstallmentPaidResponse {
  id: string;
  studentId: string;
  courseId: string;
  installmentNumber: number;
  installmentAmount: number;
  dueDate: Date;
  paidDate: Date | null;
  isPaid: boolean;
  updatedAt: Date;
}

export class MarkInstallmentPaid implements UseCase<MarkInstallmentPaidRequest, MarkInstallmentPaidResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: MarkInstallmentPaidRequest): Promise<MarkInstallmentPaidResponse> {
    const installment = await this.installmentRepo.findById(request.tenantId, request.installmentId);
    if (!installment) {
      throw new NotFoundError('FeeInstallment', request.installmentId);
    }

    let parsedPaidDate: Date | undefined;
    if (request.paidDate) {
      parsedPaidDate = new Date(request.paidDate);
      if (isNaN(parsedPaidDate.getTime())) {
        throw new ValidationError('Invalid paidDate format');
      }
    }

    installment.markPaid(parsedPaidDate);

    const updated = await this.installmentRepo.update(installment);

    return {
      id: updated.id,
      studentId: updated.studentId,
      courseId: updated.courseId,
      installmentNumber: updated.installmentNumber,
      installmentAmount: updated.installmentAmount,
      dueDate: updated.dueDate,
      paidDate: updated.paidDate,
      isPaid: updated.isPaid,
      updatedAt: updated.updatedAt,
    };
  }
}
