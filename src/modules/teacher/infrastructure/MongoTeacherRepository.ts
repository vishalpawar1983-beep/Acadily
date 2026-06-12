import { Teacher } from '../domain/entities/Teacher.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ITeacherRepository, FindAllOptions } from '../domain/repositories/ITeacherRepository.js';
import { TeacherModel, type ITeacherDocument } from './TeacherModel.js';

export class MongoTeacherRepository implements ITeacherRepository {
  async findById(tenantId: string, id: string): Promise<Teacher | null> {
    const doc = await TeacherModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<Teacher | null> {
    const doc = await TeacherModel.findOne({ tenantId, email }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ teachers: Teacher[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;
    if (options.search) {
      filter.$or = [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      TeacherModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      TeacherModel.countDocuments(filter).exec(),
    ]);

    return {
      teachers: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(teacher: Teacher): Promise<Teacher> {
    const doc = await TeacherModel.create({
      _id: teacher.id,
      tenantId: teacher.tenantId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      subjects: teacher.subjects,
      qualification: teacher.qualification,
      experience: teacher.experience,
      address: teacher.address,
      isActive: teacher.isActive,
      joiningDate: teacher.joiningDate,
    });
    return this.toDomain(doc);
  }

  async update(teacher: Teacher): Promise<Teacher> {
    const doc = await TeacherModel.findOneAndUpdate(
      { _id: teacher.id, tenantId: teacher.tenantId },
      {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone,
        subjects: teacher.subjects,
        qualification: teacher.qualification,
        experience: teacher.experience,
        address: teacher.address,
        isActive: teacher.isActive,
        joiningDate: teacher.joiningDate,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Teacher', teacher.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await TeacherModel.deleteOne({ _id: id, tenantId }).exec();
  }

  async count(tenantId: string, filter?: { isActive?: boolean }): Promise<number> {
    const query: Record<string, unknown> = { tenantId };
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    return TeacherModel.countDocuments(query).exec();
  }

  private toDomain(doc: ITeacherDocument): Teacher {
    return Teacher.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phone: doc.phone,
      subjects: doc.subjects ?? [],
      qualification: doc.qualification,
      experience: doc.experience,
      address: doc.address,
      isActive: doc.isActive,
      joiningDate: doc.joiningDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
