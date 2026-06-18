import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteStudentRequest {
  tenantId: string;
  studentId: string;
}

export interface DeleteStudentResponse {
  id: string;
  deleted: boolean;
}

export class DeleteStudent implements UseCase<DeleteStudentRequest, DeleteStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: DeleteStudentRequest): Promise<DeleteStudentResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    // Soft-delete only (repo marks the student `deleted`). Related records — fees,
    // installments, marks, issues — are intentionally KEPT so the student can be fully
    // restored. They were previously hard-deleted here, which made deletion permanent.
    await this.studentRepo.delete(request.tenantId, request.studentId);

    return {
      id: request.studentId,
      deleted: true,
    };
  }
}
