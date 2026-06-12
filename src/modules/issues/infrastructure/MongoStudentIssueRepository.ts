import { StudentIssue } from '../domain/entities/StudentIssue.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { IssueDashboard } from '../domain/entities/IssueDashboard.js';
import type {
  IStudentIssueRepository,
  FindAllIssuesOptions,
} from '../domain/repositories/IStudentIssueRepository.js';
import {
  StudentIssueModel,
  IssueDashboardModel,
  type IStudentIssueDocument,
  type IIssueDashboardDocument,
} from './StudentIssueModel.js';

export class MongoStudentIssueRepository implements IStudentIssueRepository {
  async findById(tenantId: string, id: string): Promise<StudentIssue | null> {
    const doc = await StudentIssueModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(
    tenantId: string,
    studentId: string,
    options: FindAllIssuesOptions = {},
  ): Promise<{ issues: StudentIssue[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId, studentId };
    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.particulars = { $regex: options.search, $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      StudentIssueModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ date: -1 })
        .exec(),
      StudentIssueModel.countDocuments(filter).exec(),
    ]);

    return { issues: docs.map((d) => this.toDomain(d)), total };
  }

  async findAll(
    tenantId: string,
    options: FindAllIssuesOptions = {},
  ): Promise<{ issues: StudentIssue[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.particulars = { $regex: options.search, $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      StudentIssueModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ date: -1 })
        .exec(),
      StudentIssueModel.countDocuments(filter).exec(),
    ]);

    return { issues: docs.map((d) => this.toDomain(d)), total };
  }

  async save(issue: StudentIssue): Promise<StudentIssue> {
    const doc = await StudentIssueModel.create({
      _id: issue.id,
      tenantId: issue.tenantId,
      studentId: issue.studentId,
      date: issue.date,
      particulars: issue.particulars,
      addedBy: issue.addedBy,
      showOnDashboard: issue.showOnDashboard,
      status: issue.status,
    });
    return this.toDomain(doc);
  }

  async update(issue: StudentIssue): Promise<StudentIssue> {
    const doc = await StudentIssueModel.findOneAndUpdate(
      { _id: issue.id, tenantId: issue.tenantId },
      {
        particulars: issue.particulars,
        date: issue.date,
        showOnDashboard: issue.showOnDashboard,
        status: issue.status,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('StudentIssue', issue.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await StudentIssueModel.deleteOne({ _id: id, tenantId }).exec();
  }

  // ── Dashboard ────────────────────────────────────────────

  async upsertDashboard(dashboard: IssueDashboard): Promise<IssueDashboard> {
    const doc = await IssueDashboardModel.findOneAndUpdate(
      { tenantId: dashboard.tenantId, studentId: dashboard.studentId },
      {
        tenantId: dashboard.tenantId,
        studentId: dashboard.studentId,
        showStudent: dashboard.showStudent,
      },
      { new: true, upsert: true },
    ).exec();
    return this.toDashboardDomain(doc);
  }

  async findAllDashboard(tenantId: string): Promise<IssueDashboard[]> {
    const docs = await IssueDashboardModel.find({ tenantId }).sort({ updatedAt: -1 }).limit(1000).exec();
    return docs.map((d) => this.toDashboardDomain(d));
  }

  async findDashboardByStudent(tenantId: string, studentId: string): Promise<IssueDashboard | null> {
    const doc = await IssueDashboardModel.findOne({ tenantId, studentId }).exec();
    return doc ? this.toDashboardDomain(doc) : null;
  }

  // ── Mappers ─────────────────────────────────────────────

  private toDashboardDomain(doc: IIssueDashboardDocument): IssueDashboard {
    return IssueDashboard.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      showStudent: doc.showStudent,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toDomain(doc: IStudentIssueDocument): StudentIssue {
    return StudentIssue.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      date: doc.date,
      particulars: doc.particulars,
      addedBy: doc.addedBy,
      showOnDashboard: doc.showOnDashboard,
      status: doc.status as 'open' | 'inProgress' | 'resolved' | 'closed',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
