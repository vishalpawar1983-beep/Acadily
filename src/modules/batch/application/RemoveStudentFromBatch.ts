import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface RemoveStudentFromBatchRequest {
  tenantId: string;
  batchId: string;
  studentId: string;
}

export interface RemoveStudentFromBatchResponse {
  id: string;
  name: string;
  students: BatchStudent[];
  updatedAt: Date;
}

export class RemoveStudentFromBatch
  implements UseCase<RemoveStudentFromBatchRequest, RemoveStudentFromBatchResponse>
{
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: RemoveStudentFromBatchRequest): Promise<RemoveStudentFromBatchResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    const updated = await this.batchRepo.removeStudent(
      request.tenantId,
      request.batchId,
      request.studentId,
    );

    return {
      id: updated.id,
      name: updated.name,
      students: updated.students,
      updatedAt: updated.updatedAt,
    };
  }
}
