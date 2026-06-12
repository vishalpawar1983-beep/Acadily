import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchCategoryRepository } from '../domain/repositories/IBatchCategoryRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetBatchCategoryRequest {
  tenantId: string;
  categoryId: string;
}

export interface GetBatchCategoryResponse {
  id: string;
  categoryName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetBatchCategory
  implements UseCase<GetBatchCategoryRequest, GetBatchCategoryResponse>
{
  constructor(private readonly repo: IBatchCategoryRepository) {}

  async execute(request: GetBatchCategoryRequest): Promise<GetBatchCategoryResponse> {
    const category = await this.repo.findById(request.tenantId, request.categoryId);
    if (!category) {
      throw new NotFoundError('BatchCategory', request.categoryId);
    }

    return {
      id: category.id,
      categoryName: category.categoryName,
      createdBy: category.createdBy,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
