import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IApprovalRepository } from '../domain/repositories/IApprovalRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetApprovalRequest {
  tenantId: string;
  approvalId: string;
}

export interface GetApprovalResponse {
  id: string;
  receiptId: string;
  studentId: string;
  status: string;
  reviewedBy: string;
  reviewedAt: Date | null;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetApproval implements UseCase<GetApprovalRequest, GetApprovalResponse> {
  constructor(private readonly repo: IApprovalRepository) {}

  async execute(request: GetApprovalRequest): Promise<GetApprovalResponse> {
    const approval = await this.repo.findById(request.tenantId, request.approvalId);
    if (!approval) {
      throw new NotFoundError('Approval', request.approvalId);
    }

    return {
      id: approval.id,
      receiptId: approval.receiptId,
      studentId: approval.studentId,
      status: approval.status,
      reviewedBy: approval.reviewedBy,
      reviewedAt: approval.reviewedAt,
      remarks: approval.remarks,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
    };
  }
}
