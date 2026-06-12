import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITrainerRepository } from '../domain/repositories/ITrainerRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetTrainerRequest {
  tenantId: string;
  trainerId: string;
}

export interface GetTrainerResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetTrainer implements UseCase<GetTrainerRequest, GetTrainerResponse> {
  constructor(private readonly repo: ITrainerRepository) {}

  async execute(request: GetTrainerRequest): Promise<GetTrainerResponse> {
    const trainer = await this.repo.findById(request.tenantId, request.trainerId);
    if (!trainer) {
      throw new NotFoundError('Trainer', request.trainerId);
    }

    return {
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialization: trainer.specialization,
      isActive: trainer.isActive,
      createdBy: trainer.createdBy,
      createdAt: trainer.createdAt,
      updatedAt: trainer.updatedAt,
    };
  }
}
