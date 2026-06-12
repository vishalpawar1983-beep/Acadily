import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICommissionRepository } from '../domain/repositories/ICommissionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteCommissionRequest {
  tenantId: string;
  commissionId: string;
}

export interface DeleteCommissionResponse {
  success: boolean;
}

export class DeleteCommission implements UseCase<DeleteCommissionRequest, DeleteCommissionResponse> {
  constructor(private readonly repo: ICommissionRepository) {}

  async execute(request: DeleteCommissionRequest): Promise<DeleteCommissionResponse> {
    const commission = await this.repo.findById(request.tenantId, request.commissionId);
    if (!commission) {
      throw new NotFoundError('Commission', request.commissionId);
    }

    await this.repo.delete(request.tenantId, request.commissionId);

    return { success: true };
  }
}
