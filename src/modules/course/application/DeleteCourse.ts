import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseRepository } from '../domain/repositories/ICourseRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteCourseRequest {
  tenantId: string;
  courseId: string;
}

export interface DeleteCourseResponse {
  message: string;
}

export class DeleteCourse implements UseCase<DeleteCourseRequest, DeleteCourseResponse> {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(request: DeleteCourseRequest): Promise<DeleteCourseResponse> {
    const course = await this.courseRepo.findById(request.tenantId, request.courseId);
    if (!course) {
      throw new NotFoundError('Course', request.courseId);
    }

    await this.courseRepo.delete(request.tenantId, request.courseId);

    return { message: 'Course deleted successfully' };
  }
}
