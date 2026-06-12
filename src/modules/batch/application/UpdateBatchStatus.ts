import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateBatchStatusRequest {
  tenantId: string;
  batchId: string;
  status: 'completed' | 'inProgress';
}

export interface UpdateBatchStatusResponse {
  id: string;
  name: string;
  status: string;
  students: BatchStudent[];
  updatedAt: Date;
}

export class UpdateBatchStatus
  implements UseCase<UpdateBatchStatusRequest, UpdateBatchStatusResponse>
{
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: UpdateBatchStatusRequest): Promise<UpdateBatchStatusResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    batch.updateDetails({ status: request.status });
    const updated = await this.batchRepo.update(batch);

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      students: updated.students,
      updatedAt: updated.updatedAt,
    };
  }
}
