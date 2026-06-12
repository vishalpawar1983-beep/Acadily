import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICommissionRepository } from '../domain/repositories/ICommissionRepository.js';
import { Commission } from '../domain/entities/Commission.js';

export interface CreateCommissionRequest {
  tenantId: string;
  studentName: string;
  commissionPersonName: string;
  voucherNumber?: string;
  commissionAmount: number;
  commissionPaid: number;
  commissionDate: string;
  narration?: string;
}

export interface CreateCommissionResponse {
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
}

export class CreateCommission implements UseCase<CreateCommissionRequest, CreateCommissionResponse> {
  constructor(private readonly repo: ICommissionRepository) {}

  async execute(request: CreateCommissionRequest): Promise<CreateCommissionResponse> {
    const commission = Commission.create({
      tenantId: request.tenantId,
      studentName: request.studentName,
      commissionPersonName: request.commissionPersonName,
      voucherNumber: request.voucherNumber,
      commissionAmount: request.commissionAmount,
      commissionPaid: request.commissionPaid,
      commissionDate: request.commissionDate,
      narration: request.narration,
    });

    const saved = await this.repo.save(commission);

    return {
      id: saved.id,
      studentName: saved.studentName,
      commissionPersonName: saved.commissionPersonName,
      voucherNumber: saved.voucherNumber,
      commissionAmount: saved.commissionAmount,
      commissionPaid: saved.commissionPaid,
      commissionRemaining: saved.commissionRemaining,
      commissionDate: saved.commissionDate,
      narration: saved.narration,
      createdAt: saved.createdAt,
    };
  }
}
