import { Lab } from '../domain/entities/Lab.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ILabRepository, FindAllOptions } from '../domain/repositories/ILabRepository.js';
import { LabModel, type ILabDocument } from './LabModel.js';

export class MongoLabRepository implements ILabRepository {
  async findById(tenantId: string, id: string): Promise<Lab | null> {
    const doc = await LabModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ labs: Lab[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;

    const [docs, total] = await Promise.all([
      LabModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      LabModel.countDocuments(filter).exec(),
    ]);

    return {
      labs: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(lab: Lab): Promise<Lab> {
    const doc = await LabModel.create({
      _id: lab.id,
      tenantId: lab.tenantId,
      labName: lab.labName,
      isActive: lab.isActive,
    });
    return this.toDomain(doc);
  }

  async update(lab: Lab): Promise<Lab> {
    const doc = await LabModel.findOneAndUpdate(
      { _id: lab.id, tenantId: lab.tenantId },
      {
        labName: lab.labName,
        isActive: lab.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Lab', lab.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await LabModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: ILabDocument): Lab {
    return Lab.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      labName: doc.labName,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
