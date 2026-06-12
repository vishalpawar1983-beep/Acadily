import { Course } from '../domain/entities/Course.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ICourseRepository } from '../domain/repositories/ICourseRepository.js';
import { CourseModel, type ICourseDocument } from './CourseModel.js';

export class MongoCourseRepository implements ICourseRepository {
  async findById(tenantId: string, id: string): Promise<Course | null> {
    // Also search by _legacyId for courses migrated from the legacy system
    const doc = await CourseModel.findOne({
      $or: [{ _id: id }, { _legacyId: id }],
      tenantId,
    }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: { skip?: number; limit?: number; category?: string } = {},
  ): Promise<{ courses: Course[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.category) filter.category = options.category;

    const [docs, total] = await Promise.all([
      CourseModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      CourseModel.countDocuments(filter).exec(),
    ]);

    return {
      courses: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(course: Course): Promise<Course> {
    const doc = await CourseModel.create({
      _id: course.id,
      tenantId: course.tenantId,
      name: course.name,
      fees: course.fees,
      courseType: course.courseType,
      durationYears: course.durationYears,
      category: course.category,
      subjects: course.subjects,
      isActive: course.isActive,
      createdBy: course.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(course: Course): Promise<Course> {
    const doc = await CourseModel.findOneAndUpdate(
      { _id: course.id, tenantId: course.tenantId },
      {
        name: course.name,
        fees: course.fees,
        courseType: course.courseType,
        durationYears: course.durationYears,
        category: course.category,
        subjects: course.subjects,
        isActive: course.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Course', course.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const result = await CourseModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) throw new NotFoundError('Course', id);
  }

  async count(tenantId: string): Promise<number> {
    return CourseModel.countDocuments({ tenantId }).exec();
  }

  private toDomain(doc: ICourseDocument): Course {
    return Course.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name,
      fees: doc.fees,
      courseType: doc.courseType,
      durationYears: doc.durationYears,
      category: doc.category,
      subjects: doc.subjects.map((s) => ({
        name: s.name,
        code: s.code,
        fullMarks: s.fullMarks,
        passMarks: s.passMarks,
        semester: s.semester,
      })),
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
