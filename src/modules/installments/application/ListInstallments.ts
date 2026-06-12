import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';

export interface ListInstallmentsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  studentId?: string;
  courseId?: string;
  isPaid?: boolean;
}

export interface ListInstallmentsResponse {
  installments: Array<{
    id: string;
    studentId: string;
    courseId: string;
    installmentNumber: number;
    installmentAmount: number;
    dueDate: Date;
    paidDate: Date | null;
    isPaid: boolean;
    isDropout: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListInstallments implements UseCase<ListInstallmentsRequest, ListInstallmentsResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: ListInstallmentsRequest): Promise<ListInstallmentsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { installments, total } = await this.installmentRepo.findAll(request.tenantId, {
      skip,
      limit,
      studentId: request.studentId,
      courseId: request.courseId,
      isPaid: request.isPaid,
    });

    return {
      installments: installments.map((i) => ({
        id: i.id,
        studentId: i.studentId,
        courseId: i.courseId,
        installmentNumber: i.installmentNumber,
        installmentAmount: i.installmentAmount,
        dueDate: i.dueDate,
        paidDate: i.paidDate,
        isPaid: i.isPaid,
        isDropout: i.isDropout,
        createdAt: i.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
