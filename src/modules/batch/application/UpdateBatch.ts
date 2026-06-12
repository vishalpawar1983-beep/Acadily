import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateBatchRequest {
  tenantId: string;
  batchId: string;
  name?: string;
  courseCategory?: string;
  course?: string;
  trainer?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  status?: 'completed' | 'inProgress';
  isActive?: boolean;
}

export interface UpdateBatchResponse {
  id: string;
  name: string;
  courseCategory: string;
  course: string;
  trainer: string;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  students: BatchStudent[];
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateBatch implements UseCase<UpdateBatchRequest, UpdateBatchResponse> {
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: UpdateBatchRequest): Promise<UpdateBatchResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    batch.updateDetails({
      name: request.name,
      courseCategory: request.courseCategory,
      course: request.course,
      trainer: request.trainer,
      startTime: request.startTime,
      endTime: request.endTime,
      startDate: request.startDate ? new Date(request.startDate) : undefined,
      endDate: request.endDate ? new Date(request.endDate) : undefined,
      status: request.status,
      isActive: request.isActive,
    });

    const updated = await this.batchRepo.update(batch);

    return {
      id: updated.id,
      name: updated.name,
      courseCategory: updated.courseCategory,
      course: updated.course,
      trainer: updated.trainer,
      startTime: updated.startTime,
      endTime: updated.endTime,
      startDate: updated.startDate,
      endDate: updated.endDate,
      status: updated.status,
      students: updated.students,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
