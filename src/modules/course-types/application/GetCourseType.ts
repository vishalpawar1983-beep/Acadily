import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseTypeRepository } from '../domain/repositories/ICourseTypeRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetCourseTypeRequest {
  tenantId: string;
  courseTypeId: string;
}

export interface GetCourseTypeResponse {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetCourseType implements UseCase<GetCourseTypeRequest, GetCourseTypeResponse> {
  constructor(private readonly courseTypeRepo: ICourseTypeRepository) {}

  async execute(request: GetCourseTypeRequest): Promise<GetCourseTypeResponse> {
    const courseType = await this.courseTypeRepo.findById(request.tenantId, request.courseTypeId);
    if (!courseType) {
      throw new NotFoundError('CourseType', request.courseTypeId);
    }

    return {
      id: courseType.id,
      name: courseType.name,
      createdBy: courseType.createdBy,
      createdAt: courseType.createdAt,
      updatedAt: courseType.updatedAt,
    };
  }
}
