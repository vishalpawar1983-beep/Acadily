import { CourseType } from '../domain/entities/CourseType.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ICourseTypeRepository } from '../domain/repositories/ICourseTypeRepository.js';
import { CourseTypeModel, type ICourseTypeDocument } from './CourseTypeModel.js';

export class MongoCourseTypeRepository implements ICourseTypeRepository {
  async findById(tenantId: string, id: string): Promise<CourseType | null> {
    const doc = await CourseTypeModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ courseTypes: CourseType[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };

    const [docs, total] = await Promise.all([
      CourseTypeModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      CourseTypeModel.countDocuments(filter).exec(),
    ]);

    return {
      courseTypes: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(courseType: CourseType): Promise<CourseType> {
    const doc = await CourseTypeModel.create({
      _id: courseType.id,
      tenantId: courseType.tenantId,
      name: courseType.name,
      createdBy: courseType.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(courseType: CourseType): Promise<CourseType> {
    const doc = await CourseTypeModel.findOneAndUpdate(
      { _id: courseType.id, tenantId: courseType.tenantId },
      {
        name: courseType.name,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('CourseType', courseType.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const result = await CourseTypeModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) throw new NotFoundError('CourseType', id);
  }

  async count(tenantId: string): Promise<number> {
    return CourseTypeModel.countDocuments({ tenantId }).exec();
  }

  private toDomain(doc: ICourseTypeDocument): CourseType {
    return CourseType.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name || (doc as any).courseType || '',
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
