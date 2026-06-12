import { Batch } from '../domain/entities/Batch.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { BatchStudent } from '../domain/entities/Batch.js';
import type { IBatchRepository, FindAllBatchOptions } from '../domain/repositories/IBatchRepository.js';
import { BatchModel, type IBatchDocument } from './BatchModel.js';

export class MongoBatchRepository implements IBatchRepository {
  async findById(tenantId: string, id: string): Promise<Batch | null> {
    const doc = await BatchModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllBatchOptions = {},
  ): Promise<{ batches: Batch[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;
    if (options.status !== undefined) filter.status = options.status;
    if (options.trainerEntityId !== undefined) filter.trainer = options.trainerEntityId;
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { courseCategory: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      BatchModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      BatchModel.countDocuments(filter).exec(),
    ]);

    return {
      batches: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findByCompany(
    tenantId: string,
    companyId: string,
  ): Promise<{ batches: Batch[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId, courseCategory: companyId };

    const [docs, total] = await Promise.all([
      BatchModel.find(filter).sort({ createdAt: -1 }).limit(500).exec(),
      BatchModel.countDocuments(filter).exec(),
    ]);

    return {
      batches: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(batch: Batch): Promise<Batch> {
    const doc = await BatchModel.create({
      _id: batch.id,
      tenantId: batch.tenantId,
      name: batch.name,
      courseCategory: batch.courseCategory,
      course: batch.course,
      trainer: batch.trainer,
      startTime: batch.startTime,
      endTime: batch.endTime,
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status,
      students: batch.students,
      isActive: batch.isActive,
    });
    return this.toDomain(doc);
  }

  async update(batch: Batch): Promise<Batch> {
    const doc = await BatchModel.findOneAndUpdate(
      { _id: batch.id, tenantId: batch.tenantId },
      {
        name: batch.name,
        courseCategory: batch.courseCategory,
        course: batch.course,
        trainer: batch.trainer,
        startTime: batch.startTime,
        endTime: batch.endTime,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        students: batch.students,
        isActive: batch.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Batch', batch.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await BatchModel.deleteOne({ _id: id, tenantId }).exec();
  }

  async addStudent(tenantId: string, batchId: string, student: BatchStudent): Promise<Batch> {
    const doc = await BatchModel.findOneAndUpdate(
      { _id: batchId, tenantId, 'students.studentId': { $ne: student.studentId } },
      { $push: { students: student } },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Batch', batchId);
    return this.toDomain(doc);
  }

  async removeStudent(tenantId: string, batchId: string, studentId: string): Promise<Batch> {
    const doc = await BatchModel.findOneAndUpdate(
      { _id: batchId, tenantId },
      { $pull: { students: { studentId } } },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Batch', batchId);
    return this.toDomain(doc);
  }

  async updateSubjectStatus(
    tenantId: string,
    batchId: string,
    studentId: string,
    subjectId: string,
    update: { status?: string; progress?: number; notes?: string },
  ): Promise<Batch> {
    const batch = await BatchModel.findOne({ _id: batchId, tenantId }).exec();
    if (!batch) throw new NotFoundError('Batch', batchId);

    const student = batch.students.find((s) => s.studentId === studentId);
    if (!student) throw new ValidationError(`Student ${studentId} not found in batch ${batchId}`);

    const subject = student.subjects.find((s) => s.subjectName === subjectId);
    if (!subject) throw new ValidationError(`Subject ${subjectId} not found for student ${studentId}`);

    if (update.status !== undefined) subject.status = update.status as 'notStarted' | 'inProgress' | 'completed';
    if (update.progress !== undefined) subject.progress = update.progress;
    if (update.notes !== undefined) subject.notes = update.notes;

    await batch.save();
    return this.toDomain(batch);
  }

  private toDomain(doc: IBatchDocument): Batch {
    return Batch.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name,
      courseCategory: doc.courseCategory,
      course: doc.course,
      trainer: doc.trainer,
      startTime: doc.startTime,
      endTime: doc.endTime,
      startDate: doc.startDate,
      endDate: doc.endDate,
      status: doc.status,
      students: (doc.students ?? []).map((s) => ({
        studentId: s.studentId,
        subjects: (s.subjects ?? []).map((sub) => ({
          subjectName: sub.subjectName,
          status: sub.status,
          progress: sub.progress,
          startDate: sub.startDate,
          completionDate: sub.completionDate,
          notes: sub.notes,
        })),
        currentSoftware: s.currentSoftware,
      })),
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
