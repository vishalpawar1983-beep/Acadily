import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICommissionRepository } from '../domain/repositories/ICommissionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateCommissionRequest {
  tenantId: string;
  commissionId: string;
  studentName?: string;
  commissionPersonName?: string;
  voucherNumber?: string;
  commissionAmount?: number;
  commissionPaid?: number;
  commissionDate?: string;
  narration?: string;
}

export interface UpdateCommissionResponse {
  id: string;
  studentName: string;
  commissionPersonName: string;
  voucherNumber: string;
  commissionAmount: number;
  commissionPaid: number;
  commissionRemaining: number;
  commissionDate: Date;
  narration: string;
  updatedAt: Date;
}

export class UpdateCommission implements UseCase<UpdateCommissionRequest, UpdateCommissionResponse> {
  constructor(private readonly repo: ICommissionRepository) {}

  async execute(request: UpdateCommissionRequest): Promise<UpdateCommissionResponse> {
    const commission = await this.repo.findById(request.tenantId, request.commissionId);
    if (!commission) {
      throw new NotFoundError('Commission', request.commissionId);
    }

    commission.updateDetails({
      studentName: request.studentName,
      commissionPersonName: request.commissionPersonName,
      voucherNumber: request.voucherNumber,
      commissionAmount: request.commissionAmount,
      commissionPaid: request.commissionPaid,
      commissionDate: request.commissionDate ? new Date(request.commissionDate) : undefined,
      narration: request.narration,
    });

    const updated = await this.repo.update(commission);

    return {
      id: updated.id,
      studentName: updated.studentName,
      commissionPersonName: updated.commissionPersonName,
      voucherNumber: updated.voucherNumber,
      commissionAmount: updated.commissionAmount,
      commissionPaid: updated.commissionPaid,
      commissionRemaining: updated.commissionRemaining,
      commissionDate: updated.commissionDate,
      narration: updated.narration,
      updatedAt: updated.updatedAt,
    };
  }
}
