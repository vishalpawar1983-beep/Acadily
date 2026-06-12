import { BatchCategory } from '../domain/entities/BatchCategory.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  IBatchCategoryRepository,
  FindAllOptions,
} from '../domain/repositories/IBatchCategoryRepository.js';
import { BatchCategoryModel, type IBatchCategoryDocument } from './BatchCategoryModel.js';

export class MongoBatchCategoryRepository implements IBatchCategoryRepository {
  async findById(tenantId: string, id: string): Promise<BatchCategory | null> {
    const doc = await BatchCategoryModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByName(tenantId: string, categoryName: string): Promise<BatchCategory | null> {
    const doc = await BatchCategoryModel.findOne({ tenantId, categoryName }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ categories: BatchCategory[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };

    const [docs, total] = await Promise.all([
      BatchCategoryModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      BatchCategoryModel.countDocuments(filter).exec(),
    ]);

    return {
      categories: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(category: BatchCategory): Promise<BatchCategory> {
    const doc = await BatchCategoryModel.create({
      _id: category.id,
      tenantId: category.tenantId,
      categoryName: category.categoryName,
      createdBy: category.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(category: BatchCategory): Promise<BatchCategory> {
    const doc = await BatchCategoryModel.findOneAndUpdate(
      { _id: category.id, tenantId: category.tenantId },
      {
        categoryName: category.categoryName,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('BatchCategory', category.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await BatchCategoryModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: IBatchCategoryDocument): BatchCategory {
    return BatchCategory.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      categoryName: doc.categoryName,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
