import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetBatchRequest {
  tenantId: string;
  batchId: string;
}

export interface GetBatchResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export class GetBatch implements UseCase<GetBatchRequest, GetBatchResponse> {
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: GetBatchRequest): Promise<GetBatchResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    return {
      id: batch.id,
      name: batch.name,
      courseCategory: batch.courseCategory,
      course: batch.course,
      trainer: batch.trainer,
      startTime: batch.startTime,
      endTime: batch.endTime,
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status,
      students: batch.students,
      isActive: batch.isActive,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }
}
