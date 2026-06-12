import { Timing } from '../domain/entities/Timing.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ITimingRepository, FindAllOptions } from '../domain/repositories/ITimingRepository.js';
import { TimingModel, type ITimingDocument } from './TimingModel.js';

export class MongoTimingRepository implements ITimingRepository {
  async findById(tenantId: string, id: string): Promise<Timing | null> {
    const doc = await TimingModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ timings: Timing[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;

    const [docs, total] = await Promise.all([
      TimingModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ startTime: 1 })
        .exec(),
      TimingModel.countDocuments(filter).exec(),
    ]);

    return {
      timings: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(timing: Timing): Promise<Timing> {
    const doc = await TimingModel.create({
      _id: timing.id,
      tenantId: timing.tenantId,
      startTime: timing.startTime,
      endTime: timing.endTime,
      isActive: timing.isActive,
    });
    return this.toDomain(doc);
  }

  async update(timing: Timing): Promise<Timing> {
    const doc = await TimingModel.findOneAndUpdate(
      { _id: timing.id, tenantId: timing.tenantId },
      {
        startTime: timing.startTime,
        endTime: timing.endTime,
        isActive: timing.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Timing', timing.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await TimingModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: ITimingDocument): Timing {
    return Timing.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      startTime: doc.startTime,
      endTime: doc.endTime,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
