import { PaymentOption } from '../domain/entities/PaymentOption.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  IPaymentOptionRepository,
  FindAllPaymentOptionsOptions,
} from '../domain/repositories/IPaymentOptionRepository.js';
import { PaymentOptionModel, type IPaymentOptionDocument } from './PaymentOptionModel.js';

export class MongoPaymentOptionRepository implements IPaymentOptionRepository {
  async findById(tenantId: string, id: string): Promise<PaymentOption | null> {
    const doc = await PaymentOptionModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByName(tenantId: string, name: string): Promise<PaymentOption | null> {
    const doc = await PaymentOptionModel.findOne({ tenantId, name }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllPaymentOptionsOptions = {},
  ): Promise<{ paymentOptions: PaymentOption[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;
    if (options.search) {
      filter.name = { $regex: options.search, $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      PaymentOptionModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      PaymentOptionModel.countDocuments(filter).exec(),
    ]);

    return { paymentOptions: docs.map((d) => this.toDomain(d)), total };
  }

  async save(paymentOption: PaymentOption): Promise<PaymentOption> {
    const doc = await PaymentOptionModel.create({
      _id: paymentOption.id,
      tenantId: paymentOption.tenantId,
      name: paymentOption.name,
      isActive: paymentOption.isActive,
      createdBy: paymentOption.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(paymentOption: PaymentOption): Promise<PaymentOption> {
    const doc = await PaymentOptionModel.findOneAndUpdate(
      { _id: paymentOption.id, tenantId: paymentOption.tenantId },
      {
        name: paymentOption.name,
        isActive: paymentOption.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('PaymentOption', paymentOption.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await PaymentOptionModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: IPaymentOptionDocument): PaymentOption {
    return PaymentOption.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
