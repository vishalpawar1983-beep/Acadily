import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ILabRepository } from '../domain/repositories/ILabRepository.js';

export interface ListLabsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ListLabsResponse {
  labs: Array<{
    id: string;
    labName: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListLabs implements UseCase<ListLabsRequest, ListLabsResponse> {
  constructor(private readonly repo: ILabRepository) {}

  async execute(request: ListLabsRequest): Promise<ListLabsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { labs, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
    });

    return {
      labs: labs.map((l) => ({
        id: l.id,
        labName: l.labName,
        isActive: l.isActive,
        createdAt: l.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
