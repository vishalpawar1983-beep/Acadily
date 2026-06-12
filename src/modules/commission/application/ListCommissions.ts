import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICommissionRepository } from '../domain/repositories/ICommissionRepository.js';

export interface ListCommissionsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  search?: string;
}

export interface ListCommissionsResponse {
  commissions: Array<{
    id: string;
    studentName: string;
    commissionPersonName: string;
    voucherNumber: string;
    commissionAmount: number;
    commissionPaid: number;
    commissionRemaining: number;
    commissionDate: Date;
    narration: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListCommissions implements UseCase<ListCommissionsRequest, ListCommissionsResponse> {
  constructor(private readonly repo: ICommissionRepository) {}

  async execute(request: ListCommissionsRequest): Promise<ListCommissionsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { commissions, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      search: request.search,
    });

    return {
      commissions: commissions.map((c) => ({
        id: c.id,
        studentName: c.studentName,
        commissionPersonName: c.commissionPersonName,
        voucherNumber: c.voucherNumber,
        commissionAmount: c.commissionAmount,
        commissionPaid: c.commissionPaid,
        commissionRemaining: c.commissionRemaining,
        commissionDate: c.commissionDate,
        narration: c.narration,
        createdAt: c.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
