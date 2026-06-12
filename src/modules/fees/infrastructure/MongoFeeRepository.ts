import { FeePayment } from '../domain/entities/FeePayment.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';
import { FeeModel, type IFeeDocument } from './FeeModel.js';

export class MongoFeeRepository implements IFeeRepository {
  async findById(tenantId: string, id: string): Promise<FeePayment | null> {
    const doc = await FeeModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<FeePayment[]> {
    const docs = await FeeModel.find({ tenantId, studentId })
      .sort({ paymentDate: -1 })
      .limit(500)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(
    tenantId: string,
    options: {
      skip?: number;
      limit?: number;
      studentId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{ payments: FeePayment[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.studentId) filter.studentId = options.studentId;
    if (options.startDate || options.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (options.startDate) dateFilter.$gte = options.startDate;
      if (options.endDate) dateFilter.$lte = options.endDate;
      filter.paymentDate = dateFilter;
    }

    const [docs, total] = await Promise.all([
      FeeModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ paymentDate: -1 })
        .exec(),
      FeeModel.countDocuments(filter).exec(),
    ]);

    return {
      payments: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(payment: FeePayment): Promise<FeePayment> {
    const doc = await FeeModel.create({
      _id: payment.id,
      tenantId: payment.tenantId,
      studentId: payment.studentId,
      courseId: payment.courseId,
      netCourseFees: payment.netCourseFees,
      remainingFees: payment.remainingFees,
      amountPaid: payment.amountPaid,
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
      narration: payment.narration,
      lateFees: payment.lateFees,
      gstPercentage: payment.gstPercentage,
      addedBy: payment.addedBy,
      paymentDate: payment.paymentDate,
    });
    return this.toDomain(doc);
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      amountPaid: number;
      narration: string;
      paymentDate: Date;
      lateFees: number;
      receiptNumber: string;
      remainingFees: number;
    }>,
  ): Promise<FeePayment> {
    const doc = await FeeModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: data },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('FeePayment', id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await FeeModel.deleteOne({ _id: id, tenantId }).exec();
  }

  async deleteByStudent(tenantId: string, studentId: string): Promise<void> {
    await FeeModel.deleteMany({ tenantId, studentId }).exec();
  }

  async count(tenantId: string): Promise<number> {
    return FeeModel.countDocuments({ tenantId }).exec();
  }

  private toDomain(doc: IFeeDocument): FeePayment {
    return FeePayment.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      courseId: doc.courseId,
      netCourseFees: doc.netCourseFees,
      remainingFees: doc.remainingFees,
      amountPaid: doc.amountPaid,
      receiptNumber: doc.receiptNumber,
      paymentMethod: doc.paymentMethod,
      narration: doc.narration,
      lateFees: doc.lateFees,
      gstPercentage: doc.gstPercentage,
      addedBy: doc.addedBy,
      paymentDate: doc.paymentDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
