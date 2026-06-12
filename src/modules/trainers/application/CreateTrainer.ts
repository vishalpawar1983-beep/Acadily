import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITrainerRepository } from '../domain/repositories/ITrainerRepository.js';
import { Trainer } from '../domain/entities/Trainer.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateTrainerRequest {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive?: boolean;
  createdBy: string;
}

export interface CreateTrainerResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export class CreateTrainer implements UseCase<CreateTrainerRequest, CreateTrainerResponse> {
  constructor(private readonly repo: ITrainerRepository) {}

  async execute(request: CreateTrainerRequest): Promise<CreateTrainerResponse> {
    if (request.email) {
      const existing = await this.repo.findByEmail(request.tenantId, request.email);
      if (existing) {
        throw new ConflictError(`Trainer with email "${request.email}" already exists`);
      }
    }

    const trainer = Trainer.create({
      tenantId: request.tenantId,
      name: request.name,
      email: request.email,
      phone: request.phone,
      specialization: request.specialization,
      isActive: request.isActive,
      createdBy: request.createdBy,
    });

    const saved = await this.repo.save(trainer);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      specialization: saved.specialization,
      isActive: saved.isActive,
      createdBy: saved.createdBy,
      createdAt: saved.createdAt,
    };
  }
}
