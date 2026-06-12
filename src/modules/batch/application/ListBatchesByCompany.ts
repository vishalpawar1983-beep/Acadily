import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';

export interface ListBatchesByCompanyRequest {
  tenantId: string;
  companyId: string;
}

export interface ListBatchesByCompanyResponse {
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
}

export class ListBatchesByCompany
  implements UseCase<ListBatchesByCompanyRequest, ListBatchesByCompanyResponse>
{
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: ListBatchesByCompanyRequest): Promise<ListBatchesByCompanyResponse> {
    const { batches, total } = await this.batchRepo.findByCompany(
      request.tenantId,
      request.companyId,
    );

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
    };
  }
}
