import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';
import { Category } from '../domain/entities/Category.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateCategoryRequest {
  tenantId: string;
  name: string;
  createdBy: string;
}

export interface CreateCategoryResponse {
  id: string;
  name: string;
}

export class CreateCategory implements UseCase<CreateCategoryRequest, CreateCategoryResponse> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(request: CreateCategoryRequest): Promise<CreateCategoryResponse> {
    const existing = await this.categoryRepo.findAll(request.tenantId, { limit: 1000 });
    const duplicate = existing.categories.find(
      (c) => c.name.toLowerCase() === request.name.toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = Category.create({
      tenantId: request.tenantId,
      name: request.name,
      createdBy: request.createdBy,
    });

    const saved = await this.categoryRepo.save(category);

    return {
      id: saved.id,
      name: saved.name,
    };
  }
}
