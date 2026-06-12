import { Category } from '../domain/entities/Category.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';
import { CategoryModel, type ICategoryDocument } from './CategoryModel.js';

export class MongoCategoryRepository implements ICategoryRepository {
  async findById(tenantId: string, id: string): Promise<Category | null> {
    const doc = await CategoryModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ categories: Category[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };

    const [docs, total] = await Promise.all([
      CategoryModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      CategoryModel.countDocuments(filter).exec(),
    ]);

    return {
      categories: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(category: Category): Promise<Category> {
    const doc = await CategoryModel.create({
      _id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      createdBy: category.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(category: Category): Promise<Category> {
    const doc = await CategoryModel.findOneAndUpdate(
      { _id: category.id, tenantId: category.tenantId },
      {
        name: category.name,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Category', category.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const result = await CategoryModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) throw new NotFoundError('Category', id);
  }

  async count(tenantId: string): Promise<number> {
    return CategoryModel.countDocuments({ tenantId }).exec();
  }

  private toDomain(doc: ICategoryDocument): Category {
    return Category.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name || (doc as any).category || '',
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
