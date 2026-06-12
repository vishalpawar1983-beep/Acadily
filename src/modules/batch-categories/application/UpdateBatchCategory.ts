import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchCategoryRepository } from '../domain/repositories/IBatchCategoryRepository.js';
import { NotFoundError, ConflictError } from '../../../shared/domain/errors.js';

export interface UpdateBatchCategoryRequest {
  tenantId: string;
  categoryId: string;
  categoryName: string;
}

export interface UpdateBatchCategoryResponse {
  id: string;
  categoryName: string;
  createdBy: string;
  updatedAt: Date;
}

export class UpdateBatchCategory
  implements UseCase<UpdateBatchCategoryRequest, UpdateBatchCategoryResponse>
{
  constructor(private readonly repo: IBatchCategoryRepository) {}

  async execute(request: UpdateBatchCategoryRequest): Promise<UpdateBatchCategoryResponse> {
    const category = await this.repo.findById(request.tenantId, request.categoryId);
    if (!category) {
      throw new NotFoundError('BatchCategory', request.categoryId);
    }

    const existing = await this.repo.findByName(request.tenantId, request.categoryName);
    if (existing && existing.id !== request.categoryId) {
      throw new ConflictError(`Batch category "${request.categoryName}" already exists`);
    }

    category.updateDetails({ categoryName: request.categoryName });

    const updated = await this.repo.update(category);

    return {
      id: updated.id,
      categoryName: updated.categoryName,
      createdBy: updated.createdBy,
      updatedAt: updated.updatedAt,
    };
  }
}
