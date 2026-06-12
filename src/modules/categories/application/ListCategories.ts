import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';

export interface ListCategoriesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

export interface ListCategoriesResponse {
  categories: Array<{
    id: string;
    name: string;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class ListCategories implements UseCase<ListCategoriesRequest, ListCategoriesResponse> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(request: ListCategoriesRequest): Promise<ListCategoriesResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const { categories, total } = await this.categoryRepo.findAll(request.tenantId, {
      skip,
      limit,
    });

    return {
      categories: categories.map((c) => ({
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
