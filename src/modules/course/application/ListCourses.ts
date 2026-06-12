import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseRepository } from '../domain/repositories/ICourseRepository.js';
import type { SubjectProps } from '../domain/entities/Course.js';

export interface ListCoursesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  category?: string;
}

export interface ListCoursesResponse {
  courses: Array<{
    id: string;
    name: string;
    fees: number;
    courseType: string;
    durationYears: number;
    category: string;
    subjects: SubjectProps[];
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class ListCourses implements UseCase<ListCoursesRequest, ListCoursesResponse> {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(request: ListCoursesRequest): Promise<ListCoursesResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const { courses, total } = await this.courseRepo.findAll(request.tenantId, {
      skip,
      limit,
      category: request.category,
    });

    return {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        fees: c.fees,
        courseType: c.courseType,
        durationYears: c.durationYears,
        category: c.category,
        subjects: c.subjects,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
