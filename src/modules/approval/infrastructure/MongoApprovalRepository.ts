import { Approval } from '../domain/entities/Approval.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  IApprovalRepository,
  FindAllApprovalsOptions,
} from '../domain/repositories/IApprovalRepository.js';
import { ApprovalModel, type IApprovalDocument } from './ApprovalModel.js';

export class MongoApprovalRepository implements IApprovalRepository {
  async findById(tenantId: string, id: string): Promise<Approval | null> {
    const doc = await ApprovalModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(
    tenantId: string,
    studentId: string,
    options: FindAllApprovalsOptions = {},
  ): Promise<{ approvals: Approval[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId, studentId };
    if (options.status) filter.status = options.status;

    const [docs, total] = await Promise.all([
      ApprovalModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      ApprovalModel.countDocuments(filter).exec(),
    ]);

    return { approvals: docs.map((d) => this.toDomain(d)), total };
  }

  async findAll(
    tenantId: string,
    options: FindAllApprovalsOptions = {},
  ): Promise<{ approvals: Approval[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.status) filter.status = options.status;

    const [docs, total] = await Promise.all([
      ApprovalModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      ApprovalModel.countDocuments(filter).exec(),
    ]);

    return { approvals: docs.map((d) => this.toDomain(d)), total };
  }

  async findPending(
    tenantId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ approvals: Approval[]; total: number }> {
    const filter = { tenantId, status: 'pending' };

    const [docs, total] = await Promise.all([
      ApprovalModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      ApprovalModel.countDocuments(filter).exec(),
    ]);

    return { approvals: docs.map((d) => this.toDomain(d)), total };
  }

  async save(approval: Approval): Promise<Approval> {
    const doc = await ApprovalModel.create({
      _id: approval.id,
      tenantId: approval.tenantId,
      receiptId: approval.receiptId,
      studentId: approval.studentId,
      status: approval.status,
      reviewedBy: approval.reviewedBy,
      reviewedAt: approval.reviewedAt,
      remarks: approval.remarks,
    });
    return this.toDomain(doc);
  }

  async update(approval: Approval): Promise<Approval> {
    const doc = await ApprovalModel.findOneAndUpdate(
      { _id: approval.id, tenantId: approval.tenantId },
      {
        status: approval.status,
        reviewedBy: approval.reviewedBy,
        reviewedAt: approval.reviewedAt,
        remarks: approval.remarks,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Approval', approval.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IApprovalDocument): Approval {
    return Approval.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      receiptId: doc.receiptId,
      studentId: doc.studentId,
      status: doc.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: doc.reviewedBy,
      reviewedAt: doc.reviewedAt,
      remarks: doc.remarks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
