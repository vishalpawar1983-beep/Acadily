import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseTypeRepository } from '../domain/repositories/ICourseTypeRepository.js';
import { CourseType } from '../domain/entities/CourseType.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateCourseTypeRequest {
  tenantId: string;
  name: string;
  createdBy: string;
}

export interface CreateCourseTypeResponse {
  id: string;
  name: string;
}

export class CreateCourseType implements UseCase<CreateCourseTypeRequest, CreateCourseTypeResponse> {
  constructor(private readonly courseTypeRepo: ICourseTypeRepository) {}

  async execute(request: CreateCourseTypeRequest): Promise<CreateCourseTypeResponse> {
    const existing = await this.courseTypeRepo.findAll(request.tenantId, { limit: 1000 });
    const duplicate = existing.courseTypes.find(
      (c) => c.name.toLowerCase() === request.name.toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictError('Course type with this name already exists');
    }

    const courseType = CourseType.create({
      tenantId: request.tenantId,
      name: request.name,
      createdBy: request.createdBy,
    });

    const saved = await this.courseTypeRepo.save(courseType);

    return {
      id: saved.id,
      name: saved.name,
    };
  }
}
