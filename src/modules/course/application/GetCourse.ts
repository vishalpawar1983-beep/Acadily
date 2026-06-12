import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseRepository } from '../domain/repositories/ICourseRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { SubjectProps } from '../domain/entities/Course.js';

export interface GetCourseRequest {
  tenantId: string;
  courseId: string;
}

export interface GetCourseResponse {
  id: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects: SubjectProps[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetCourse implements UseCase<GetCourseRequest, GetCourseResponse> {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(request: GetCourseRequest): Promise<GetCourseResponse> {
    const course = await this.courseRepo.findById(request.tenantId, request.courseId);
    if (!course) {
      throw new NotFoundError('Course', request.courseId);
    }

    return {
      id: course.id,
      name: course.name,
      fees: course.fees,
      courseType: course.courseType,
      durationYears: course.durationYears,
      category: course.category,
      subjects: course.subjects,
      isActive: course.isActive,
      createdBy: course.createdBy,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
