import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchCategoryRepository } from '../domain/repositories/IBatchCategoryRepository.js';
import { BatchCategory } from '../domain/entities/BatchCategory.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateBatchCategoryRequest {
  tenantId: string;
  categoryName: string;
  createdBy: string;
}

export interface CreateBatchCategoryResponse {
  id: string;
  categoryName: string;
  createdBy: string;
  createdAt: Date;
}

export class CreateBatchCategory
  implements UseCase<CreateBatchCategoryRequest, CreateBatchCategoryResponse>
{
  constructor(private readonly repo: IBatchCategoryRepository) {}

  async execute(request: CreateBatchCategoryRequest): Promise<CreateBatchCategoryResponse> {
    const existing = await this.repo.findByName(request.tenantId, request.categoryName);
    if (existing) {
      throw new ConflictError(`Batch category "${request.categoryName}" already exists`);
    }

    const category = BatchCategory.create({
      tenantId: request.tenantId,
      categoryName: request.categoryName,
      createdBy: request.createdBy,
    });

    const saved = await this.repo.save(category);

    return {
      id: saved.id,
      categoryName: saved.categoryName,
      createdBy: saved.createdBy,
      createdAt: saved.createdAt,
    };
  }
}
