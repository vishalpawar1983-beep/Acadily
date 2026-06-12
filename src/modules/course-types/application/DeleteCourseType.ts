import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseTypeRepository } from '../domain/repositories/ICourseTypeRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteCourseTypeRequest {
  tenantId: string;
  courseTypeId: string;
}

export interface DeleteCourseTypeResponse {
  message: string;
}

export class DeleteCourseType implements UseCase<DeleteCourseTypeRequest, DeleteCourseTypeResponse> {
  constructor(private readonly courseTypeRepo: ICourseTypeRepository) {}

  async execute(request: DeleteCourseTypeRequest): Promise<DeleteCourseTypeResponse> {
    const courseType = await this.courseTypeRepo.findById(request.tenantId, request.courseTypeId);
    if (!courseType) {
      throw new NotFoundError('CourseType', request.courseTypeId);
    }

    await this.courseTypeRepo.delete(request.tenantId, request.courseTypeId);

    return { message: 'Course type deleted successfully' };
  }
}
