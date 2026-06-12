import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ILabRepository } from '../domain/repositories/ILabRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateLabRequest {
  tenantId: string;
  labId: string;
  labName?: string;
  isActive?: boolean;
}

export interface UpdateLabResponse {
  id: string;
  labName: string;
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateLab implements UseCase<UpdateLabRequest, UpdateLabResponse> {
  constructor(private readonly repo: ILabRepository) {}

  async execute(request: UpdateLabRequest): Promise<UpdateLabResponse> {
    const lab = await this.repo.findById(request.tenantId, request.labId);
    if (!lab) {
      throw new NotFoundError('Lab', request.labId);
    }

    lab.updateDetails({
      labName: request.labName,
      isActive: request.isActive,
    });

    const updated = await this.repo.update(lab);

    return {
      id: updated.id,
      labName: updated.labName,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
