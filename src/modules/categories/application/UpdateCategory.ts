import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateCategoryRequest {
  tenantId: string;
  categoryId: string;
  name?: string;
}

export interface UpdateCategoryResponse {
  id: string;
  name: string;
  updatedAt: Date;
}

export class UpdateCategory implements UseCase<UpdateCategoryRequest, UpdateCategoryResponse> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(request: UpdateCategoryRequest): Promise<UpdateCategoryResponse> {
    const category = await this.categoryRepo.findById(request.tenantId, request.categoryId);
    if (!category) {
      throw new NotFoundError('Category', request.categoryId);
    }

    category.updateDetails({
      name: request.name,
    });

    const updated = await this.categoryRepo.update(category);

    return {
      id: updated.id,
      name: updated.name,
      updatedAt: updated.updatedAt,
    };
  }
}
