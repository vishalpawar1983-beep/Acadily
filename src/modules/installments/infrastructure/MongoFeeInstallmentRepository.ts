import { FeeInstallment } from '../domain/entities/FeeInstallment.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IFeeInstallmentRepository, FindAllInstallmentsOptions } from '../domain/repositories/IFeeInstallmentRepository.js';
import { FeeInstallmentModel, type IFeeInstallmentDocument } from './FeeInstallmentModel.js';

export class MongoFeeInstallmentRepository implements IFeeInstallmentRepository {
  async findById(tenantId: string, id: string): Promise<FeeInstallment | null> {
    const doc = await FeeInstallmentModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<FeeInstallment[]> {
    const docs = await FeeInstallmentModel.find({ tenantId, studentId })
      .sort({ installmentNumber: 1 })
      .limit(500)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByStudentAndCourse(tenantId: string, studentId: string, courseId: string): Promise<FeeInstallment[]> {
    const docs = await FeeInstallmentModel.find({ tenantId, studentId, courseId })
      .sort({ installmentNumber: 1 })
      .limit(500)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findOverdue(tenantId: string): Promise<FeeInstallment[]> {
    const docs = await FeeInstallmentModel.find({
      tenantId,
      dueDate: { $lt: new Date() },
      isPaid: false,
      isDropout: false,
    })
      .sort({ dueDate: 1 })
      .limit(1000)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(
    tenantId: string,
    options: FindAllInstallmentsOptions = {},
  ): Promise<{ installments: FeeInstallment[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.studentId) filter.studentId = options.studentId;
    if (options.courseId) filter.courseId = options.courseId;
    if (options.isPaid !== undefined) filter.isPaid = options.isPaid;

    const [docs, total] = await Promise.all([
      FeeInstallmentModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      FeeInstallmentModel.countDocuments(filter).exec(),
    ]);

    return {
      installments: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(installment: FeeInstallment): Promise<FeeInstallment> {
    const doc = await FeeInstallmentModel.create({
      _id: installment.id,
      tenantId: installment.tenantId,
      studentId: installment.studentId,
      courseId: installment.courseId,
      installmentNumber: installment.installmentNumber,
      installmentAmount: installment.installmentAmount,
      dueDate: installment.dueDate,
      paidDate: installment.paidDate,
      isPaid: installment.isPaid,
      isDropout: installment.isDropout,
      lateFeeAmount: installment.lateFeeAmount,
    });
    return this.toDomain(doc);
  }

  async update(installment: FeeInstallment): Promise<FeeInstallment> {
    const doc = await FeeInstallmentModel.findOneAndUpdate(
      { _id: installment.id, tenantId: installment.tenantId },
      {
        installmentAmount: installment.installmentAmount,
        dueDate: installment.dueDate,
        paidDate: installment.paidDate,
        isPaid: installment.isPaid,
        isDropout: installment.isDropout,
        lateFeeAmount: installment.lateFeeAmount,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('FeeInstallment', installment.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IFeeInstallmentDocument): FeeInstallment {
    return FeeInstallment.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      courseId: doc.courseId,
      installmentNumber: doc.installmentNumber,
      installmentAmount: doc.installmentAmount,
      dueDate: doc.dueDate,
      paidDate: doc.paidDate,
      isPaid: doc.isPaid,
      isDropout: doc.isDropout,
      lateFeeAmount: doc.lateFeeAmount ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
