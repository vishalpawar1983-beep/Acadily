import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudent, BatchStudentSubject } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface AddStudentToBatchRequest {
  tenantId: string;
  batchId: string;
  studentId: string;
  subjects?: BatchStudentSubject[];
  currentSoftware?: string;
}

export interface AddStudentToBatchResponse {
  id: string;
  name: string;
  students: BatchStudent[];
  updatedAt: Date;
}

export class AddStudentToBatch implements UseCase<AddStudentToBatchRequest, AddStudentToBatchResponse> {
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: AddStudentToBatchRequest): Promise<AddStudentToBatchResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    const student: BatchStudent = {
      studentId: request.studentId,
      subjects: request.subjects ?? [],
      currentSoftware: request.currentSoftware,
    };

    const updated = await this.batchRepo.addStudent(request.tenantId, request.batchId, student);

    return {
      id: updated.id,
      name: updated.name,
      students: updated.students,
      updatedAt: updated.updatedAt,
    };
  }
}
