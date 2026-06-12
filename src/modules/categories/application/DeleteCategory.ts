import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteCategoryRequest {
  tenantId: string;
  categoryId: string;
}

export interface DeleteCategoryResponse {
  message: string;
}

export class DeleteCategory implements UseCase<DeleteCategoryRequest, DeleteCategoryResponse> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(request: DeleteCategoryRequest): Promise<DeleteCategoryResponse> {
    const category = await this.categoryRepo.findById(request.tenantId, request.categoryId);
    if (!category) {
      throw new NotFoundError('Category', request.categoryId);
    }

    await this.categoryRepo.delete(request.tenantId, request.categoryId);

    return { message: 'Category deleted successfully' };
  }
}
