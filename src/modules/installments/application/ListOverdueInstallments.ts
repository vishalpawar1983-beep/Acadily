import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';

export interface ListOverdueInstallmentsRequest {
  tenantId: string;
}

export interface ListOverdueInstallmentsResponse {
  installments: Array<{
    id: string;
    studentId: string;
    courseId: string;
    installmentNumber: number;
    installmentAmount: number;
    dueDate: Date;
    isPaid: boolean;
    isDropout: boolean;
    createdAt: Date;
  }>;
}

export class ListOverdueInstallments implements UseCase<ListOverdueInstallmentsRequest, ListOverdueInstallmentsResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: ListOverdueInstallmentsRequest): Promise<ListOverdueInstallmentsResponse> {
    const installments = await this.installmentRepo.findOverdue(request.tenantId);

    return {
      installments: installments.map((i) => ({
        id: i.id,
        studentId: i.studentId,
        courseId: i.courseId,
        installmentNumber: i.installmentNumber,
        installmentAmount: i.installmentAmount,
        dueDate: i.dueDate,
        isPaid: i.isPaid,
        isDropout: i.isDropout,
        createdAt: i.createdAt,
      })),
    };
  }
}
