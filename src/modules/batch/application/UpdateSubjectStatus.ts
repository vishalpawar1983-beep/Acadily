import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateSubjectStatusRequest {
  tenantId: string;
  batchId: string;
  studentId: string;
  subjectId: string;
  status?: string;
  progress?: number;
  notes?: string;
}

export interface UpdateSubjectStatusResponse {
  id: string;
  name: string;
  students: BatchStudent[];
  updatedAt: Date;
}

export class UpdateSubjectStatus
  implements UseCase<UpdateSubjectStatusRequest, UpdateSubjectStatusResponse>
{
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: UpdateSubjectStatusRequest): Promise<UpdateSubjectStatusResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    const updated = await this.batchRepo.updateSubjectStatus(
      request.tenantId,
      request.batchId,
      request.studentId,
      request.subjectId,
      {
        status: request.status,
        progress: request.progress,
        notes: request.notes,
      },
    );

    return {
      id: updated.id,
      name: updated.name,
      students: updated.students,
      updatedAt: updated.updatedAt,
    };
  }
}
