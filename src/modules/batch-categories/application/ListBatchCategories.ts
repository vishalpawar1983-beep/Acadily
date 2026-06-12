import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchCategoryRepository } from '../domain/repositories/IBatchCategoryRepository.js';

export interface ListBatchCategoriesRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListBatchCategoriesResponse {
  categories: Array<{
    id: string;
    categoryName: string;
    createdBy: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListBatchCategories
  implements UseCase<ListBatchCategoriesRequest, ListBatchCategoriesResponse>
{
  constructor(private readonly repo: IBatchCategoryRepository) {}

  async execute(request: ListBatchCategoriesRequest): Promise<ListBatchCategoriesResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { categories, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
    });

    return {
      categories: categories.map((c) => ({
        id: c.id,
        categoryName: c.categoryName,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
