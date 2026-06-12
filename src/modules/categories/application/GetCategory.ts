import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetCategoryRequest {
  tenantId: string;
  categoryId: string;
}

export interface GetCategoryResponse {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetCategory implements UseCase<GetCategoryRequest, GetCategoryResponse> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(request: GetCategoryRequest): Promise<GetCategoryResponse> {
    const category = await this.categoryRepo.findById(request.tenantId, request.categoryId);
    if (!category) {
      throw new NotFoundError('Category', request.categoryId);
    }

    return {
      id: category.id,
      name: category.name,
      createdBy: category.createdBy,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
