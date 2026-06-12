import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IApprovalRepository } from '../domain/repositories/IApprovalRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface ReviewApprovalRequest {
  tenantId: string;
  approvalId: string;
  status: 'approved' | 'rejected';
  reviewedBy: string;
  remarks?: string;
}

export interface ReviewApprovalResponse {
  id: string;
  receiptId: string;
  studentId: string;
  status: string;
  reviewedBy: string;
  reviewedAt: Date | null;
  remarks: string;
  updatedAt: Date;
}

export class ReviewApproval implements UseCase<ReviewApprovalRequest, ReviewApprovalResponse> {
  constructor(private readonly repo: IApprovalRepository) {}

  async execute(request: ReviewApprovalRequest): Promise<ReviewApprovalResponse> {
    const approval = await this.repo.findById(request.tenantId, request.approvalId);
    if (!approval) {
      throw new NotFoundError('Approval', request.approvalId);
    }

    approval.review({
      status: request.status,
      reviewedBy: request.reviewedBy,
      remarks: request.remarks,
    });

    const updated = await this.repo.update(approval);

    return {
      id: updated.id,
      receiptId: updated.receiptId,
      studentId: updated.studentId,
      status: updated.status,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt,
      remarks: updated.remarks,
      updatedAt: updated.updatedAt,
    };
  }
}
