import { StudentAlert } from '../domain/entities/StudentAlert.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AlertStatus } from '../domain/entities/StudentAlert.js';
import type { IStudentAlertRepository } from '../domain/repositories/IStudentAlertRepository.js';
import { StudentAlertModel, type IStudentAlertDocument } from './StudentAlertModel.js';

export class MongoStudentAlertRepository implements IStudentAlertRepository {
  async findById(tenantId: string, id: string): Promise<StudentAlert | null> {
    const doc = await StudentAlertModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(tenantId: string): Promise<StudentAlert[]> {
    const docs = await StudentAlertModel.find({ tenantId })
      .sort({ reminderDateTime: -1 })
      .limit(500)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(alert: StudentAlert): Promise<StudentAlert> {
    const doc = await StudentAlertModel.create({
      _id: alert.id,
      tenantId: alert.tenantId,
      studentId: alert.studentId,
      date: alert.date,
      reminderDateTime: alert.reminderDateTime,
      status: alert.status,
      particulars: alert.particulars,
      createdBy: alert.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(alert: StudentAlert): Promise<StudentAlert> {
    const doc = await StudentAlertModel.findOneAndUpdate(
      { _id: alert.id, tenantId: alert.tenantId },
      {
        date: alert.date,
        reminderDateTime: alert.reminderDateTime,
        status: alert.status,
        particulars: alert.particulars,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('StudentAlert', alert.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await StudentAlertModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: IStudentAlertDocument): StudentAlert {
    return StudentAlert.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      date: doc.date,
      reminderDateTime: doc.reminderDateTime,
      status: doc.status as AlertStatus,
      particulars: doc.particulars,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
