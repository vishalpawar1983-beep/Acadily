import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITrainerRepository } from '../domain/repositories/ITrainerRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateTrainerRequest {
  tenantId: string;
  trainerId: string;
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive?: boolean;
}

export interface UpdateTrainerResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateTrainer implements UseCase<UpdateTrainerRequest, UpdateTrainerResponse> {
  constructor(private readonly repo: ITrainerRepository) {}

  async execute(request: UpdateTrainerRequest): Promise<UpdateTrainerResponse> {
    const trainer = await this.repo.findById(request.tenantId, request.trainerId);
    if (!trainer) {
      throw new NotFoundError('Trainer', request.trainerId);
    }

    trainer.updateDetails({
      name: request.name,
      email: request.email,
      phone: request.phone,
      specialization: request.specialization,
      isActive: request.isActive,
    });

    const updated = await this.repo.update(trainer);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      specialization: updated.specialization,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
