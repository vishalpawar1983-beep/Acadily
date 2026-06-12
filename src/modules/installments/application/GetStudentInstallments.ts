import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';

export interface GetStudentInstallmentsRequest {
  tenantId: string;
  studentId: string;
}

export interface GetStudentInstallmentsResponse {
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
}

export class GetStudentInstallments implements UseCase<GetStudentInstallmentsRequest, GetStudentInstallmentsResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: GetStudentInstallmentsRequest): Promise<GetStudentInstallmentsResponse> {
    const installments = await this.installmentRepo.findByStudent(request.tenantId, request.studentId);

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
    };
  }
}
