import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ILabRepository } from '../domain/repositories/ILabRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteLabRequest {
  tenantId: string;
  labId: string;
}

export interface DeleteLabResponse {
  success: boolean;
}

export class DeleteLab implements UseCase<DeleteLabRequest, DeleteLabResponse> {
  constructor(private readonly repo: ILabRepository) {}

  async execute(request: DeleteLabRequest): Promise<DeleteLabResponse> {
    const lab = await this.repo.findById(request.tenantId, request.labId);
    if (!lab) {
      throw new NotFoundError('Lab', request.labId);
    }

    await this.repo.delete(request.tenantId, request.labId);

    return { success: true };
  }
}
