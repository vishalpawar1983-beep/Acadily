import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IApprovalRepository } from '../domain/repositories/IApprovalRepository.js';
import { Approval } from '../domain/entities/Approval.js';

export interface CreateApprovalRequest {
  tenantId: string;
  receiptId: string;
  studentId: string;
  remarks?: string;
}

export interface CreateApprovalResponse {
  id: string;
  receiptId: string;
  studentId: string;
  status: string;
  remarks: string;
  createdAt: Date;
}

export class CreateApproval implements UseCase<CreateApprovalRequest, CreateApprovalResponse> {
  constructor(private readonly repo: IApprovalRepository) {}

  async execute(request: CreateApprovalRequest): Promise<CreateApprovalResponse> {
    const approval = Approval.create({
      tenantId: request.tenantId,
      receiptId: request.receiptId,
      studentId: request.studentId,
      remarks: request.remarks,
    });

    const saved = await this.repo.save(approval);

    return {
      id: saved.id,
      receiptId: saved.receiptId,
      studentId: saved.studentId,
      status: saved.status,
      remarks: saved.remarks,
      createdAt: saved.createdAt,
    };
  }
}
