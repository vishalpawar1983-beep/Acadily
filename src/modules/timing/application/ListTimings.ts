import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITimingRepository } from '../domain/repositories/ITimingRepository.js';

export interface ListTimingsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ListTimingsResponse {
  timings: Array<{
    id: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListTimings implements UseCase<ListTimingsRequest, ListTimingsResponse> {
  constructor(private readonly repo: ITimingRepository) {}

  async execute(request: ListTimingsRequest): Promise<ListTimingsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { timings, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
    });

    return {
      timings: timings.map((t) => ({
        id: t.id,
        startTime: t.startTime,
        endTime: t.endTime,
        isActive: t.isActive,
        createdAt: t.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
