import { Subject } from '../domain/entities/Subject.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ISubjectRepository, FindAllSubjectsOptions } from '../domain/repositories/ISubjectRepository.js';
import { SubjectModel, type ISubjectDocument } from './SubjectModel.js';

export class MongoSubjectRepository implements ISubjectRepository {
  async findById(tenantId: string, id: string): Promise<Subject | null> {
    const doc = await SubjectModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByCourseId(tenantId: string, courseId: string): Promise<Subject[]> {
    const docs = await SubjectModel.find({ tenantId, courseId }).sort({ createdAt: -1 }).limit(500).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(
    tenantId: string,
    options: FindAllSubjectsOptions = {},
  ): Promise<{ subjects: Subject[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.courseId) filter.courseId = options.courseId;

    const [docs, total] = await Promise.all([
      SubjectModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      SubjectModel.countDocuments(filter).exec(),
    ]);

    return {
      subjects: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(subject: Subject): Promise<Subject> {
    const doc = await SubjectModel.create({
      _id: subject.id,
      tenantId: subject.tenantId,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      fullMarks: subject.fullMarks,
      passMarks: subject.passMarks,
      semYear: subject.semYear,
      courseId: subject.courseId,
      addedBy: subject.addedBy,
    });
    return this.toDomain(doc);
  }

  async update(subject: Subject): Promise<Subject> {
    const doc = await SubjectModel.findOneAndUpdate(
      { _id: subject.id, tenantId: subject.tenantId },
      {
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        fullMarks: subject.fullMarks,
        passMarks: subject.passMarks,
        semYear: subject.semYear,
        courseId: subject.courseId,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Subject', subject.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await SubjectModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: ISubjectDocument): Subject {
    return Subject.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      subjectName: doc.subjectName,
      subjectCode: doc.subjectCode,
      fullMarks: doc.fullMarks,
      passMarks: doc.passMarks,
      semYear: doc.semYear,
      courseId: doc.courseId,
      addedBy: doc.addedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
