import { Trainer } from '../domain/entities/Trainer.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ITrainerRepository, FindAllOptions } from '../domain/repositories/ITrainerRepository.js';
import { TrainerModel, type ITrainerDocument } from './TrainerModel.js';

export class MongoTrainerRepository implements ITrainerRepository {
  async findById(tenantId: string, id: string): Promise<Trainer | null> {
    const doc = await TrainerModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<Trainer | null> {
    const doc = await TrainerModel.findOne({ tenantId, email }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ trainers: Trainer[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;

    const [docs, total] = await Promise.all([
      TrainerModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      TrainerModel.countDocuments(filter).exec(),
    ]);

    return {
      trainers: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(trainer: Trainer): Promise<Trainer> {
    const doc = await TrainerModel.create({
      _id: trainer.id,
      tenantId: trainer.tenantId,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialization: trainer.specialization,
      isActive: trainer.isActive,
      createdBy: trainer.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(trainer: Trainer): Promise<Trainer> {
    const doc = await TrainerModel.findOneAndUpdate(
      { _id: trainer.id, tenantId: trainer.tenantId },
      {
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        specialization: trainer.specialization,
        isActive: trainer.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Trainer', trainer.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await TrainerModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: ITrainerDocument): Trainer {
    return Trainer.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      specialization: doc.specialization,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
