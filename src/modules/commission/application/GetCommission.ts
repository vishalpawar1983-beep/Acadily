import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICommissionRepository } from '../domain/repositories/ICommissionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetCommissionRequest {
  tenantId: string;
  commissionId: string;
}

export interface GetCommissionResponse {
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
  updatedAt: Date;
}

export class GetCommission implements UseCase<GetCommissionRequest, GetCommissionResponse> {
  constructor(private readonly repo: ICommissionRepository) {}

  async execute(request: GetCommissionRequest): Promise<GetCommissionResponse> {
    const commission = await this.repo.findById(request.tenantId, request.commissionId);
    if (!commission) {
      throw new NotFoundError('Commission', request.commissionId);
    }

    return {
      id: commission.id,
      studentName: commission.studentName,
      commissionPersonName: commission.commissionPersonName,
      voucherNumber: commission.voucherNumber,
      commissionAmount: commission.commissionAmount,
      commissionPaid: commission.commissionPaid,
      commissionRemaining: commission.commissionRemaining,
      commissionDate: commission.commissionDate,
      narration: commission.narration,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt,
    };
  }
}
