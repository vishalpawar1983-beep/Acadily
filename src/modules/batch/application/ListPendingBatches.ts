import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';

export interface ListPendingBatchesRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListPendingBatchesResponse {
  batches: Array<{
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
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListPendingBatches
  implements UseCase<ListPendingBatchesRequest, ListPendingBatchesResponse>
{
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: ListPendingBatchesRequest): Promise<ListPendingBatchesResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { batches, total } = await this.batchRepo.findAll(request.tenantId, {
      skip,
      limit,
      status: 'inProgress',
    });

    return {
      batches: batches.map((b) => ({
        id: b.id,
        name: b.name,
        courseCategory: b.courseCategory,
        course: b.course,
        trainer: b.trainer,
        startTime: b.startTime,
        endTime: b.endTime,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        students: b.students,
        isActive: b.isActive,
        createdAt: b.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
