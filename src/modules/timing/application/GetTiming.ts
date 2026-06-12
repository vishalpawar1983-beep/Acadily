import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITimingRepository } from '../domain/repositories/ITimingRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetTimingRequest {
  tenantId: string;
  timingId: string;
}

export interface GetTimingResponse {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetTiming implements UseCase<GetTimingRequest, GetTimingResponse> {
  constructor(private readonly repo: ITimingRepository) {}

  async execute(request: GetTimingRequest): Promise<GetTimingResponse> {
    const timing = await this.repo.findById(request.tenantId, request.timingId);
    if (!timing) {
      throw new NotFoundError('Timing', request.timingId);
    }

    return {
      id: timing.id,
      startTime: timing.startTime,
      endTime: timing.endTime,
      isActive: timing.isActive,
      createdAt: timing.createdAt,
      updatedAt: timing.updatedAt,
    };
  }
}
