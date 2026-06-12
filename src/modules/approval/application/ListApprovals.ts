import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IApprovalRepository } from '../domain/repositories/IApprovalRepository.js';

export interface ListApprovalsRequest {
  tenantId: string;
  studentId?: string;
  skip?: number;
  limit?: number;
  status?: string;
}

export interface ListApprovalsResponse {
  approvals: Array<{
    id: string;
    receiptId: string;
    studentId: string;
    status: string;
    reviewedBy: string;
    reviewedAt: Date | null;
    remarks: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListApprovals implements UseCase<ListApprovalsRequest, ListApprovalsResponse> {
  constructor(private readonly repo: IApprovalRepository) {}

  async execute(request: ListApprovalsRequest): Promise<ListApprovalsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { approvals, total } = request.studentId
      ? await this.repo.findByStudent(request.tenantId, request.studentId, { skip, limit, status: request.status })
      : await this.repo.findAll(request.tenantId, { skip, limit, status: request.status });

    return {
      approvals: approvals.map((a) => ({
        id: a.id,
        receiptId: a.receiptId,
        studentId: a.studentId,
        status: a.status,
        reviewedBy: a.reviewedBy,
        reviewedAt: a.reviewedAt,
        remarks: a.remarks,
        createdAt: a.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
