import { Commission } from '../domain/entities/Commission.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  ICommissionRepository,
  FindAllOptions,
} from '../domain/repositories/ICommissionRepository.js';
import { CommissionModel, type ICommissionDocument } from './CommissionModel.js';

export class MongoCommissionRepository implements ICommissionRepository {
  async findById(tenantId: string, id: string): Promise<Commission | null> {
    const doc = await CommissionModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ commissions: Commission[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.search) {
      filter.$or = [
        { studentName: { $regex: options.search, $options: 'i' } },
        { commissionPersonName: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      CommissionModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ commissionDate: -1 })
        .exec(),
      CommissionModel.countDocuments(filter).exec(),
    ]);

    return {
      commissions: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(commission: Commission): Promise<Commission> {
    const doc = await CommissionModel.create({
      _id: commission.id,
      tenantId: commission.tenantId,
      studentName: commission.studentName,
      commissionPersonName: commission.commissionPersonName,
      voucherNumber: commission.voucherNumber,
      commissionAmount: commission.commissionAmount,
      commissionPaid: commission.commissionPaid,
      commissionRemaining: commission.commissionRemaining,
      commissionDate: commission.commissionDate,
      narration: commission.narration,
    });
    return this.toDomain(doc);
  }

  async update(commission: Commission): Promise<Commission> {
    const doc = await CommissionModel.findOneAndUpdate(
      { _id: commission.id, tenantId: commission.tenantId },
      {
        studentName: commission.studentName,
        commissionPersonName: commission.commissionPersonName,
        voucherNumber: commission.voucherNumber,
        commissionAmount: commission.commissionAmount,
        commissionPaid: commission.commissionPaid,
        commissionRemaining: commission.commissionRemaining,
        commissionDate: commission.commissionDate,
        narration: commission.narration,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Commission', commission.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await CommissionModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: ICommissionDocument): Commission {
    return Commission.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentName: doc.studentName,
      commissionPersonName: doc.commissionPersonName,
      voucherNumber: doc.voucherNumber,
      commissionAmount: doc.commissionAmount,
      commissionPaid: doc.commissionPaid,
      commissionRemaining: doc.commissionRemaining,
      commissionDate: doc.commissionDate,
      narration: doc.narration,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
