import { Attendance } from '../domain/entities/Attendance.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IAttendanceRepository } from '../domain/repositories/IAttendanceRepository.js';
import { AttendanceModel, type IAttendanceDocument } from './AttendanceModel.js';
import type { StudentRecord, AttendanceStatus } from '../domain/entities/Attendance.js';

export class MongoAttendanceRepository implements IAttendanceRepository {
  async findByBatchAndMonth(
    tenantId: string,
    batchId: string,
    month: number,
    year: number,
  ): Promise<Attendance | null> {
    const doc = await AttendanceModel.findOne({
      tenantId,
      batch: batchId,
      month,
      year,
    }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(attendance: Attendance): Promise<Attendance> {
    const doc = await AttendanceModel.create({
      _id: attendance.id,
      tenantId: attendance.tenantId,
      batch: attendance.batchId,
      month: attendance.month,
      year: attendance.year,
      students: this.toStudentsSubdocs(attendance.records),
    });
    return this.toDomain(doc);
  }

  async update(attendance: Attendance): Promise<Attendance> {
    const doc = await AttendanceModel.findOneAndUpdate(
      { _id: attendance.id, tenantId: attendance.tenantId },
      {
        batch: attendance.batchId,
        month: attendance.month,
        year: attendance.year,
        students: this.toStudentsSubdocs(attendance.records),
      },
      { new: true },
    ).exec();
    if (!doc) {
      throw new NotFoundError('Attendance', attendance.id);
    }
    return this.toDomain(doc);
  }

  async findByStudent(
    tenantId: string,
    studentId: string,
    options: { month?: number; year?: number } = {},
  ): Promise<Attendance[]> {
    const filter: Record<string, unknown> = {
      tenantId,
      'students.student': studentId,
    };
    if (options.month !== undefined) filter.month = options.month;
    if (options.year !== undefined) filter.year = options.year;

    const docs = await AttendanceModel.find(filter)
      .sort({ year: -1, month: -1 })
      .limit(500)
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  private toStudentsSubdocs(
    records: ReadonlyArray<StudentRecord>,
  ): Array<{ student: string; days: Map<string, string> }> {
    return records.map((r) => ({
      student: r.studentId,
      days: new Map(Object.entries(r.days)),
    }));
  }

  private toDomain(doc: IAttendanceDocument): Attendance {
    const records: StudentRecord[] = (doc.students ?? []).map((s) => ({
      studentId: s.student,
      days: Object.fromEntries(s.days) as Record<string, AttendanceStatus>,
    }));

    return Attendance.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      batchId: doc.batch,
      month: doc.month,
      year: doc.year,
      records,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
