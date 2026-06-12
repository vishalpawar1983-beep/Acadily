import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseTypeRepository } from '../domain/repositories/ICourseTypeRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateCourseTypeRequest {
  tenantId: string;
  courseTypeId: string;
  name?: string;
}

export interface UpdateCourseTypeResponse {
  id: string;
  name: string;
  updatedAt: Date;
}

export class UpdateCourseType implements UseCase<UpdateCourseTypeRequest, UpdateCourseTypeResponse> {
  constructor(private readonly courseTypeRepo: ICourseTypeRepository) {}

  async execute(request: UpdateCourseTypeRequest): Promise<UpdateCourseTypeResponse> {
    const courseType = await this.courseTypeRepo.findById(request.tenantId, request.courseTypeId);
    if (!courseType) {
      throw new NotFoundError('CourseType', request.courseTypeId);
    }

    courseType.updateDetails({
      name: request.name,
    });

    const updated = await this.courseTypeRepo.update(courseType);

    return {
      id: updated.id,
      name: updated.name,
      updatedAt: updated.updatedAt,
    };
  }
}
