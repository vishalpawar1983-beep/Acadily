import { RollNumberCounter } from '../domain/entities/RollNumberCounter.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IRollNumberRepository } from '../domain/repositories/IRollNumberRepository.js';
import { RollNumberModel, type IRollNumberDocument } from './RollNumberModel.js';

export class MongoRollNumberRepository implements IRollNumberRepository {
  async findByTenant(tenantId: string): Promise<RollNumberCounter | null> {
    const doc = await RollNumberModel.findOne({ tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async incrementAndGet(tenantId: string): Promise<string> {
    const doc = await RollNumberModel.findOneAndUpdate(
      { tenantId },
      { $inc: { currentValue: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    return `${doc.prefix}${doc.currentValue}`;
  }

  async save(counter: RollNumberCounter): Promise<RollNumberCounter> {
    const doc = await RollNumberModel.create({
      _id: counter.id,
      tenantId: counter.tenantId,
      prefix: counter.prefix,
      currentValue: counter.currentValue,
    });
    return this.toDomain(doc);
  }

  async update(counter: RollNumberCounter): Promise<RollNumberCounter> {
    const doc = await RollNumberModel.findOneAndUpdate(
      { tenantId: counter.tenantId },
      {
        prefix: counter.prefix,
        currentValue: counter.currentValue,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('RollNumberCounter', counter.tenantId);
    return this.toDomain(doc);
  }

  private toDomain(doc: IRollNumberDocument): RollNumberCounter {
    return RollNumberCounter.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      prefix: doc.prefix,
      currentValue: doc.currentValue,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
