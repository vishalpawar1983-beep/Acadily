import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITrainerRepository } from '../domain/repositories/ITrainerRepository.js';

export interface ListTrainersRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ListTrainersResponse {
  trainers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListTrainers implements UseCase<ListTrainersRequest, ListTrainersResponse> {
  constructor(private readonly repo: ITrainerRepository) {}

  async execute(request: ListTrainersRequest): Promise<ListTrainersResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { trainers, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
    });

    return {
      trainers: trainers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        specialization: t.specialization,
        isActive: t.isActive,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
