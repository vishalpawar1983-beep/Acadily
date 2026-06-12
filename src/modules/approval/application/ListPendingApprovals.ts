import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IApprovalRepository } from '../domain/repositories/IApprovalRepository.js';

export interface ListPendingApprovalsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListPendingApprovalsResponse {
  approvals: Array<{
    id: string;
    receiptId: string;
    studentId: string;
    status: string;
    remarks: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListPendingApprovals implements UseCase<ListPendingApprovalsRequest, ListPendingApprovalsResponse> {
  constructor(private readonly repo: IApprovalRepository) {}

  async execute(request: ListPendingApprovalsRequest): Promise<ListPendingApprovalsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { approvals, total } = await this.repo.findPending(request.tenantId, { skip, limit });

    return {
      approvals: approvals.map((a) => ({
        id: a.id,
        receiptId: a.receiptId,
        studentId: a.studentId,
        status: a.status,
        remarks: a.remarks,
        createdAt: a.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
