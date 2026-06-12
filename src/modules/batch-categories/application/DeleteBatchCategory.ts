import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchCategoryRepository } from '../domain/repositories/IBatchCategoryRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteBatchCategoryRequest {
  tenantId: string;
  categoryId: string;
}

export interface DeleteBatchCategoryResponse {
  success: boolean;
}

export class DeleteBatchCategory
  implements UseCase<DeleteBatchCategoryRequest, DeleteBatchCategoryResponse>
{
  constructor(private readonly repo: IBatchCategoryRepository) {}

  async execute(request: DeleteBatchCategoryRequest): Promise<DeleteBatchCategoryResponse> {
    const category = await this.repo.findById(request.tenantId, request.categoryId);
    if (!category) {
      throw new NotFoundError('BatchCategory', request.categoryId);
    }

    await this.repo.delete(request.tenantId, request.categoryId);

    return { success: true };
  }
}
