import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseRepository } from '../domain/repositories/ICourseRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { SubjectProps } from '../domain/entities/Course.js';

export interface UpdateCourseRequest {
  tenantId: string;
  courseId: string;
  name?: string;
  fees?: number;
  courseType?: string;
  durationYears?: number;
  category?: string;
  subjects?: SubjectProps[];
  isActive?: boolean;
}

export interface UpdateCourseResponse {
  id: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects: SubjectProps[];
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateCourse implements UseCase<UpdateCourseRequest, UpdateCourseResponse> {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(request: UpdateCourseRequest): Promise<UpdateCourseResponse> {
    const course = await this.courseRepo.findById(request.tenantId, request.courseId);
    if (!course) {
      throw new NotFoundError('Course', request.courseId);
    }

    course.updateDetails({
      name: request.name,
      fees: request.fees,
      courseType: request.courseType,
      durationYears: request.durationYears,
      category: request.category,
      subjects: request.subjects,
      isActive: request.isActive,
    });

    const updated = await this.courseRepo.update(course);

    return {
      id: updated.id,
      name: updated.name,
      fees: updated.fees,
      courseType: updated.courseType,
      durationYears: updated.durationYears,
      category: updated.category,
      subjects: updated.subjects,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
