import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITimingRepository } from '../domain/repositories/ITimingRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteTimingRequest {
  tenantId: string;
  timingId: string;
}

export interface DeleteTimingResponse {
  success: boolean;
}

export class DeleteTiming implements UseCase<DeleteTimingRequest, DeleteTimingResponse> {
  constructor(private readonly repo: ITimingRepository) {}

  async execute(request: DeleteTimingRequest): Promise<DeleteTimingResponse> {
    const timing = await this.repo.findById(request.tenantId, request.timingId);
    if (!timing) {
      throw new NotFoundError('Timing', request.timingId);
    }

    await this.repo.delete(request.tenantId, request.timingId);

    return { success: true };
  }
}
