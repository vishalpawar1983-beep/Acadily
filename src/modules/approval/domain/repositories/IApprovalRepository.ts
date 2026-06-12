import { Approval } from '../entities/Approval.js';

export interface FindAllApprovalsOptions {
  skip?: number;
  limit?: number;
  status?: string;
}

export interface IApprovalRepository {
  findById(tenantId: string, id: string): Promise<Approval | null>;
  findByStudent(
    tenantId: string,
    studentId: string,
    options?: FindAllApprovalsOptions,
  ): Promise<{ approvals: Approval[]; total: number }>;
  findAll(
    tenantId: string,
    options?: FindAllApprovalsOptions,
  ): Promise<{ approvals: Approval[]; total: number }>;
  findPending(
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<{ approvals: Approval[]; total: number }>;
  save(approval: Approval): Promise<Approval>;
  update(approval: Approval): Promise<Approval>;
}
