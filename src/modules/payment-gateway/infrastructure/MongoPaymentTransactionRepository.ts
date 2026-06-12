import { PaymentTransaction } from '../domain/entities/PaymentTransaction.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  IPaymentTransactionRepository,
  FindAllPaymentTransactionsOptions,
} from '../domain/repositories/IPaymentTransactionRepository.js';
import { PaymentTransactionModel, type IPaymentTransactionDocument } from './PaymentTransactionModel.js';

export class MongoPaymentTransactionRepository implements IPaymentTransactionRepository {
  async findById(tenantId: string, id: string): Promise<PaymentTransaction | null> {
    const doc = await PaymentTransactionModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByTransactionId(tenantId: string, transactionId: string): Promise<PaymentTransaction | null> {
    const doc = await PaymentTransactionModel.findOne({ tenantId, transactionId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllPaymentTransactionsOptions = {},
  ): Promise<{ transactions: PaymentTransaction[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.status) filter.status = options.status;
    if (options.studentId) filter.studentId = options.studentId;

    const [docs, total] = await Promise.all([
      PaymentTransactionModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      PaymentTransactionModel.countDocuments(filter).exec(),
    ]);

    return { transactions: docs.map((d) => this.toDomain(d)), total };
  }

  async save(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const doc = await PaymentTransactionModel.create({
      _id: transaction.id,
      tenantId: transaction.tenantId,
      transactionId: transaction.transactionId,
      studentId: transaction.studentId,
      amount: transaction.amount,
      status: transaction.status,
      paymentGateway: transaction.paymentGateway,
      gatewayResponse: transaction.gatewayResponse,
      courseId: transaction.courseId,
    });
    return this.toDomain(doc);
  }

  async update(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const doc = await PaymentTransactionModel.findOneAndUpdate(
      { _id: transaction.id, tenantId: transaction.tenantId },
      {
        status: transaction.status,
        gatewayResponse: transaction.gatewayResponse,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('PaymentTransaction', transaction.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IPaymentTransactionDocument): PaymentTransaction {
    return PaymentTransaction.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      transactionId: doc.transactionId,
      studentId: doc.studentId,
      amount: doc.amount,
      status: doc.status,
      paymentGateway: doc.paymentGateway,
      gatewayResponse: doc.gatewayResponse ?? {},
      courseId: doc.courseId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
