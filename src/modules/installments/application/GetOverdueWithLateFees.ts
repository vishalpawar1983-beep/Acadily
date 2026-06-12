import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';

export interface GetOverdueWithLateFeesRequest {
  tenantId: string;
}

export interface GetOverdueWithLateFeesResponse {
  installments: Array<{
    id: string;
    studentId: string;
    courseId: string;
    installmentNumber: number;
    installmentAmount: number;
    dueDate: Date;
    monthsOverdue: number;
    lateFeeAmount: number;
    totalDue: number;
    isPaid: boolean;
    isDropout: boolean;
    createdAt: Date;
  }>;
  totalOverdue: number;
  totalLateFees: number;
}

export class GetOverdueWithLateFees implements UseCase<GetOverdueWithLateFeesRequest, GetOverdueWithLateFeesResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: GetOverdueWithLateFeesRequest): Promise<GetOverdueWithLateFeesResponse> {
    const overdueInstallments = await this.installmentRepo.findOverdue(request.tenantId);

    let totalLateFees = 0;

    const installments = overdueInstallments.map((i) => {
      const monthsOverdue = i.calculateMonthsOverdue();
      totalLateFees += i.lateFeeAmount;

      return {
        id: i.id,
        studentId: i.studentId,
        courseId: i.courseId,
        installmentNumber: i.installmentNumber,
        installmentAmount: i.installmentAmount,
        dueDate: i.dueDate,
        monthsOverdue,
        lateFeeAmount: i.lateFeeAmount,
        totalDue: i.installmentAmount + i.lateFeeAmount,
        isPaid: i.isPaid,
        isDropout: i.isDropout,
        createdAt: i.createdAt,
      };
    });

    return {
      installments,
      totalOverdue: installments.length,
      totalLateFees,
    };
  }
}
