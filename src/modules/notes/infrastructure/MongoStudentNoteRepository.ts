import { StudentNote } from '../domain/entities/StudentNote.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  IStudentNoteRepository,
  FindAllNotesOptions,
} from '../domain/repositories/IStudentNoteRepository.js';
import { StudentNoteModel, type IStudentNoteDocument } from './StudentNoteModel.js';

export class MongoStudentNoteRepository implements IStudentNoteRepository {
  async findById(tenantId: string, id: string): Promise<StudentNote | null> {
    const doc = await StudentNoteModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(
    tenantId: string,
    studentId: string,
    options: FindAllNotesOptions = {},
  ): Promise<{ notes: StudentNote[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId, studentId };
    if (options.search) {
      filter.particulars = { $regex: options.search, $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      StudentNoteModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ date: -1 })
        .exec(),
      StudentNoteModel.countDocuments(filter).exec(),
    ]);

    return { notes: docs.map((d) => this.toDomain(d)), total };
  }

  async findAll(
    tenantId: string,
    options: FindAllNotesOptions = {},
  ): Promise<{ notes: StudentNote[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.search) {
      filter.particulars = { $regex: options.search, $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      StudentNoteModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ date: -1 })
        .exec(),
      StudentNoteModel.countDocuments(filter).exec(),
    ]);

    return { notes: docs.map((d) => this.toDomain(d)), total };
  }

  async findPendingReminders(tenantId: string, today: Date): Promise<StudentNote[]> {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const docs = await StudentNoteModel.find({
      tenantId,
      startTime: { $ne: null },
      $or: [
        { endDate: null },
        { endDate: { $gte: startOfDay } },
      ],
    })
      .sort({ startTime: 1 })
      .exec();

    return docs.map((d) => this.toDomain(d));
  }

  async save(note: StudentNote): Promise<StudentNote> {
    const doc = await StudentNoteModel.create({
      _id: note.id,
      tenantId: note.tenantId,
      studentId: note.studentId,
      date: note.date,
      particulars: note.particulars,
      addedBy: note.addedBy,
      startTime: note.startTime,
      endDate: note.endDate,
    });
    return this.toDomain(doc);
  }

  async update(note: StudentNote): Promise<StudentNote> {
    const doc = await StudentNoteModel.findOneAndUpdate(
      { _id: note.id, tenantId: note.tenantId },
      {
        particulars: note.particulars,
        date: note.date,
        startTime: note.startTime,
        endDate: note.endDate,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('StudentNote', note.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await StudentNoteModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: IStudentNoteDocument): StudentNote {
    return StudentNote.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      date: doc.date,
      particulars: doc.particulars,
      addedBy: doc.addedBy,
      startTime: doc.startTime,
      endDate: (doc as any).endDate ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
