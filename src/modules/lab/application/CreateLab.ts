import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ILabRepository } from '../domain/repositories/ILabRepository.js';
import { Lab } from '../domain/entities/Lab.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateLabRequest {
  tenantId: string;
  labName: string;
  isActive?: boolean;
}

export interface CreateLabResponse {
  id: string;
  labName: string;
  isActive: boolean;
  createdAt: Date;
}

export class CreateLab implements UseCase<CreateLabRequest, CreateLabResponse> {
  constructor(private readonly repo: ILabRepository) {}

  async execute(request: CreateLabRequest): Promise<CreateLabResponse> {
    const { labs } = await this.repo.findAll(request.tenantId);
    const existing = labs.find((l) => l.labName === request.labName);
    if (existing) {
      throw new ConflictError(`Lab "${request.labName}" already exists`);
    }

    const lab = Lab.create({
      tenantId: request.tenantId,
      labName: request.labName,
      isActive: request.isActive,
    });

    const saved = await this.repo.save(lab);

    return {
      id: saved.id,
      labName: saved.labName,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
