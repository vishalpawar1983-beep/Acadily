import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITrainerRepository } from '../domain/repositories/ITrainerRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteTrainerRequest {
  tenantId: string;
  trainerId: string;
}

export interface DeleteTrainerResponse {
  success: boolean;
}

export class DeleteTrainer implements UseCase<DeleteTrainerRequest, DeleteTrainerResponse> {
  constructor(private readonly repo: ITrainerRepository) {}

  async execute(request: DeleteTrainerRequest): Promise<DeleteTrainerResponse> {
    const trainer = await this.repo.findById(request.tenantId, request.trainerId);
    if (!trainer) {
      throw new NotFoundError('Trainer', request.trainerId);
    }

    await this.repo.delete(request.tenantId, request.trainerId);

    return { success: true };
  }
}
