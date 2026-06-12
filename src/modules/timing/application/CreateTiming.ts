import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITimingRepository } from '../domain/repositories/ITimingRepository.js';
import { Timing } from '../domain/entities/Timing.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateTimingRequest {
  tenantId: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface CreateTimingResponse {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
}

export class CreateTiming implements UseCase<CreateTimingRequest, CreateTimingResponse> {
  constructor(private readonly repo: ITimingRepository) {}

  async execute(request: CreateTimingRequest): Promise<CreateTimingResponse> {
    const { timings } = await this.repo.findAll(request.tenantId);
    const existing = timings.find(
      (t) => t.startTime === request.startTime && t.endTime === request.endTime,
    );
    if (existing) {
      throw new ConflictError(`Timing slot ${request.startTime} - ${request.endTime} already exists`);
    }

    const timing = Timing.create({
      tenantId: request.tenantId,
      startTime: request.startTime,
      endTime: request.endTime,
      isActive: request.isActive,
    });

    const saved = await this.repo.save(timing);

    return {
      id: saved.id,
      startTime: saved.startTime,
      endTime: saved.endTime,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
