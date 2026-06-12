import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITimingRepository } from '../domain/repositories/ITimingRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateTimingRequest {
  tenantId: string;
  timingId: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface UpdateTimingResponse {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateTiming implements UseCase<UpdateTimingRequest, UpdateTimingResponse> {
  constructor(private readonly repo: ITimingRepository) {}

  async execute(request: UpdateTimingRequest): Promise<UpdateTimingResponse> {
    const timing = await this.repo.findById(request.tenantId, request.timingId);
    if (!timing) {
      throw new NotFoundError('Timing', request.timingId);
    }

    timing.updateDetails({
      startTime: request.startTime,
      endTime: request.endTime,
      isActive: request.isActive,
    });

    const updated = await this.repo.update(timing);

    return {
      id: updated.id,
      startTime: updated.startTime,
      endTime: updated.endTime,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
