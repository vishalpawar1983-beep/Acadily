import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseTypeRepository } from '../domain/repositories/ICourseTypeRepository.js';

export interface ListCourseTypesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

export interface ListCourseTypesResponse {
  courseTypes: Array<{
    id: string;
    name: string;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class ListCourseTypes implements UseCase<ListCourseTypesRequest, ListCourseTypesResponse> {
  constructor(private readonly courseTypeRepo: ICourseTypeRepository) {}

  async execute(request: ListCourseTypesRequest): Promise<ListCourseTypesResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const { courseTypes, total } = await this.courseTypeRepo.findAll(request.tenantId, {
      skip,
      limit,
    });

    return {
      courseTypes: courseTypes.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
