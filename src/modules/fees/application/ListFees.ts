import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';

export interface ListFeesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListFeesResponse {
  payments: Array<{
    id: string;
    studentId: string;
    courseId: string;
    netCourseFees: number;
    remainingFees: number;
    amountPaid: number;
    receiptNumber: string;
    paymentMethod: string;
    lateFees: number;
    gstPercentage: number;
    paymentDate: Date;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class ListFees implements UseCase<ListFeesRequest, ListFeesResponse> {
  constructor(private readonly feeRepo: IFeeRepository) {}

  async execute(request: ListFeesRequest): Promise<ListFeesResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const { payments, total } = await this.feeRepo.findAll(request.tenantId, {
      skip,
      limit,
      studentId: request.studentId,
      startDate: request.startDate ? new Date(request.startDate) : undefined,
      endDate: request.endDate ? new Date(request.endDate) : undefined,
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
        lateFees: p.lateFees,
        gstPercentage: p.gstPercentage,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
