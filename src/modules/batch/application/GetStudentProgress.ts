import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import type { BatchStudentSubject } from '../domain/entities/Batch.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetStudentProgressRequest {
  tenantId: string;
  batchId: string;
  studentId: string;
}

export interface GetStudentProgressResponse {
  studentId: string;
  subjects: BatchStudentSubject[];
  currentSoftware?: string;
}

export class GetStudentProgress
  implements UseCase<GetStudentProgressRequest, GetStudentProgressResponse>
{
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: GetStudentProgressRequest): Promise<GetStudentProgressResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    const student = batch.students.find((s) => s.studentId === request.studentId);
    if (!student) {
      throw new NotFoundError('Student in Batch', request.studentId);
    }

    return {
      studentId: student.studentId,
      subjects: student.subjects,
      currentSoftware: student.currentSoftware,
    };
  }
}
