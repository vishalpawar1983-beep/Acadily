import { StudentMarks } from '../domain/entities/StudentMarks.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ResultStatus } from '../domain/entities/StudentMarks.js';
import type { IStudentMarksRepository, FindAllMarksOptions } from '../domain/repositories/IStudentMarksRepository.js';
import { StudentMarksModel, type IStudentMarksDocument } from './StudentMarksModel.js';

export class MongoStudentMarksRepository implements IStudentMarksRepository {
  async findById(tenantId: string, id: string): Promise<StudentMarks | null> {
    const doc = await StudentMarksModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<StudentMarks[]> {
    const docs = await StudentMarksModel.find({ tenantId, studentId }).sort({ createdAt: -1 }).limit(500).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByStudentAndCourse(tenantId: string, studentId: string, courseId: string): Promise<StudentMarks | null> {
    const doc = await StudentMarksModel.findOne({ tenantId, studentId, courseId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllMarksOptions = {},
  ): Promise<{ marks: StudentMarks[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.studentId) filter.studentId = options.studentId;
    if (options.courseId) filter.courseId = options.courseId;
    if (options.resultStatus) filter.resultStatus = options.resultStatus;

    const [docs, total] = await Promise.all([
      StudentMarksModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      StudentMarksModel.countDocuments(filter).exec(),
    ]);

    return {
      marks: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(marks: StudentMarks): Promise<StudentMarks> {
    const doc = await StudentMarksModel.create({
      _id: marks.id,
      tenantId: marks.tenantId,
      studentId: marks.studentId,
      courseId: marks.courseId,
      subjects: marks.subjects,
      resultStatus: marks.resultStatus,
    });
    return this.toDomain(doc);
  }

  async update(marks: StudentMarks): Promise<StudentMarks> {
    const doc = await StudentMarksModel.findOneAndUpdate(
      { _id: marks.id, tenantId: marks.tenantId },
      {
        studentId: marks.studentId,
        courseId: marks.courseId,
        subjects: marks.subjects,
        resultStatus: marks.resultStatus,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('StudentMarks', marks.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IStudentMarksDocument): StudentMarks {
    return StudentMarks.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      courseId: doc.courseId,
      subjects: doc.subjects.map((s) => ({
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        theory: s.theory,
        practical: s.practical,
        totalMarks: s.totalMarks,
        isActive: s.isActive,
      })),
      resultStatus: doc.resultStatus as ResultStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
