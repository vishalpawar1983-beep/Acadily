import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';

export interface ListAllFeesRequest {
  tenantId: string;
}

export interface ListAllFeesResponse {
  payments: Array<{
    id: string;
    studentId: string;
    courseId: string;
    netCourseFees: number;
    remainingFees: number;
    amountPaid: number;
    receiptNumber: string;
    paymentMethod: string;
    narration?: string;
    lateFees: number;
    gstPercentage: number;
    addedBy: string;
    paymentDate: Date;
    createdAt: Date;
  }>;
  total: number;
}

export class ListAllFees implements UseCase<ListAllFeesRequest, ListAllFeesResponse> {
  constructor(private readonly feeRepo: IFeeRepository) {}

  async execute(request: ListAllFeesRequest): Promise<ListAllFeesResponse> {
    const { payments, total } = await this.feeRepo.findAll(request.tenantId, {
      skip: 0,
      limit: 0,
    });

    return {
      payments: payments.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        courseId: p.courseId,
        netCourseFees: p.netCourseFees,
        remainingFees: p.remainingFees,
        amountPaid: p.amountPaid,
        receiptNumber: p.receiptNumber,
        paymentMethod: p.paymentMethod,
        narration: p.narration,
        lateFees: p.lateFees,
        gstPercentage: p.gstPercentage,
        addedBy: p.addedBy,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
      })),
      total,
    };
  }
}
