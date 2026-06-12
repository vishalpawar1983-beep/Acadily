import { CourseCompletion } from '../domain/entities/CourseCompletion.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { CompletionStatus } from '../domain/entities/CourseCompletion.js';
import type { ICourseCompletionRepository, FindAllCompletionsOptions } from '../domain/repositories/ICourseCompletionRepository.js';
import { CourseCompletionModel, type ICourseCompletionDocument } from './CourseCompletionModel.js';

export class MongoCourseCompletionRepository implements ICourseCompletionRepository {
  async findById(tenantId: string, id: string): Promise<CourseCompletion | null> {
    const doc = await CourseCompletionModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<CourseCompletion[]> {
    const docs = await CourseCompletionModel.find({ tenantId, studentId }).sort({ createdAt: -1 }).limit(500).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(
    tenantId: string,
    options: FindAllCompletionsOptions = {},
  ): Promise<{ completions: CourseCompletion[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.studentId) filter.studentId = options.studentId;
    if (options.courseId) filter.courseId = options.courseId;
    if (options.status) filter.status = options.status;

    const [docs, total] = await Promise.all([
      CourseCompletionModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      CourseCompletionModel.countDocuments(filter).exec(),
    ]);

    return {
      completions: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(completion: CourseCompletion): Promise<CourseCompletion> {
    const doc = await CourseCompletionModel.create({
      _id: completion.id,
      tenantId: completion.tenantId,
      studentId: completion.studentId,
      courseId: completion.courseId,
      completionDate: completion.completionDate,
      certificateNumber: completion.certificateNumber,
      remarks: completion.remarks,
      status: completion.status,
    });
    return this.toDomain(doc);
  }

  async update(completion: CourseCompletion): Promise<CourseCompletion> {
    const doc = await CourseCompletionModel.findOneAndUpdate(
      { _id: completion.id, tenantId: completion.tenantId },
      {
        studentId: completion.studentId,
        courseId: completion.courseId,
        completionDate: completion.completionDate,
        certificateNumber: completion.certificateNumber,
        remarks: completion.remarks,
        status: completion.status,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('CourseCompletion', completion.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: ICourseCompletionDocument): CourseCompletion {
    return CourseCompletion.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      courseId: doc.courseId,
      completionDate: doc.completionDate,
      certificateNumber: doc.certificateNumber,
      remarks: doc.remarks,
      status: doc.status as CompletionStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
