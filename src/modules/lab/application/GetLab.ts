import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ILabRepository } from '../domain/repositories/ILabRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetLabRequest {
  tenantId: string;
  labId: string;
}

export interface GetLabResponse {
  id: string;
  labName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetLab implements UseCase<GetLabRequest, GetLabResponse> {
  constructor(private readonly repo: ILabRepository) {}

  async execute(request: GetLabRequest): Promise<GetLabResponse> {
    const lab = await this.repo.findById(request.tenantId, request.labId);
    if (!lab) {
      throw new NotFoundError('Lab', request.labId);
    }

    return {
      id: lab.id,
      labName: lab.labName,
      isActive: lab.isActive,
      createdAt: lab.createdAt,
      updatedAt: lab.updatedAt,
    };
  }
}
