import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';

export interface GetStudentFeesRequest {
  tenantId: string;
  studentId: string;
}

export interface GetStudentFeesResponse {
  payments: Array<{
    id: string;
    courseId: string;
    netCourseFees: number;
    remainingFees: number;
    amountPaid: number;
    receiptNumber: string;
    paymentMethod: string;
    narration?: string;
    lateFees: number;
    gstPercentage: number;
    paymentDate: Date;
    createdAt: Date;
  }>;
  totalPaid: number;
}

export class GetStudentFees implements UseCase<GetStudentFeesRequest, GetStudentFeesResponse> {
  constructor(private readonly feeRepo: IFeeRepository) {}

  async execute(request: GetStudentFeesRequest): Promise<GetStudentFeesResponse> {
    const payments = await this.feeRepo.findByStudent(request.tenantId, request.studentId);

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        courseId: p.courseId,
        netCourseFees: p.netCourseFees,
        remainingFees: p.remainingFees,
        amountPaid: p.amountPaid,
        receiptNumber: p.receiptNumber,
        paymentMethod: p.paymentMethod,
        narration: p.narration,
        lateFees: p.lateFees,
        gstPercentage: p.gstPercentage,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
      })),
      totalPaid,
    };
  }
}
