import { NumberOfYears } from '../domain/entities/NumberOfYears.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { INumberOfYearsRepository } from '../domain/repositories/INumberOfYearsRepository.js';
import { NumberOfYearsModel, type INumberOfYearsDocument } from './NumberOfYearsModel.js';

export class MongoNumberOfYearsRepository implements INumberOfYearsRepository {
  async findById(tenantId: string, id: string): Promise<NumberOfYears | null> {
    const doc = await NumberOfYearsModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ numberOfYears: NumberOfYears[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };

    const [docs, total] = await Promise.all([
      NumberOfYearsModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      NumberOfYearsModel.countDocuments(filter).exec(),
    ]);

    return {
      numberOfYears: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(numberOfYears: NumberOfYears): Promise<NumberOfYears> {
    const doc = await NumberOfYearsModel.create({
      _id: numberOfYears.id,
      tenantId: numberOfYears.tenantId,
      value: numberOfYears.value,
      createdBy: numberOfYears.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(numberOfYears: NumberOfYears): Promise<NumberOfYears> {
    const doc = await NumberOfYearsModel.findOneAndUpdate(
      { _id: numberOfYears.id, tenantId: numberOfYears.tenantId },
      {
        value: numberOfYears.value,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('NumberOfYears', numberOfYears.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const result = await NumberOfYearsModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) throw new NotFoundError('NumberOfYears', id);
  }

  async count(tenantId: string): Promise<number> {
    return NumberOfYearsModel.countDocuments({ tenantId }).exec();
  }

  private toDomain(doc: INumberOfYearsDocument): NumberOfYears {
    return NumberOfYears.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      value: doc.value ?? (doc as any).numberOfYears ?? 0,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
