import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITeacherRepository } from '../domain/repositories/ITeacherRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteTeacherRequest {
  tenantId: string;
  teacherId: string;
}

export interface DeleteTeacherResponse {
  success: boolean;
}

export class DeleteTeacher implements UseCase<DeleteTeacherRequest, DeleteTeacherResponse> {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(request: DeleteTeacherRequest): Promise<DeleteTeacherResponse> {
    const teacher = await this.teacherRepo.findById(request.tenantId, request.teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher', request.teacherId);
    }

    await this.teacherRepo.delete(request.tenantId, request.teacherId);

    return { success: true };
  }
}
