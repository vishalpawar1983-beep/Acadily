import { ReceiptCounter } from "../domain/entities/ReceiptCounter.js";
import { NotFoundError } from "../../../shared/domain/errors.js";
import type { IReceiptCounterRepository } from "../domain/repositories/IReceiptCounterRepository.js";
import {
  ReceiptCounterModel,
  type IReceiptCounterDocument,
} from "./ReceiptCounterModel.js";

export class MongoReceiptCounterRepository implements IReceiptCounterRepository {
  async findByTenant(tenantId: string): Promise<ReceiptCounter | null> {
    const doc = await ReceiptCounterModel.findOne({ tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(counter: ReceiptCounter): Promise<ReceiptCounter> {
    const existing = await ReceiptCounterModel.findOne({
      tenantId: counter.tenantId,
    }).exec();
    if (existing) {
      const doc = await ReceiptCounterModel.findOneAndUpdate(
        { tenantId: counter.tenantId },
        {
          prefix: counter.prefix,
          currentValue: counter.currentValue,
        },
        { new: true },
      ).exec();
      if (!doc) throw new NotFoundError("ReceiptCounter", counter.tenantId);
      return this.toDomain(doc);
    }

    const doc = await ReceiptCounterModel.create({
      _id: counter.id,
      tenantId: counter.tenantId,
      prefix: counter.prefix,
      currentValue: counter.currentValue,
    });
    return this.toDomain(doc);
  }

  async incrementAndGet(
    tenantId: string,
  ): Promise<{ receiptNumber: string; currentValue: number }> {
    const doc = await ReceiptCounterModel.findOneAndUpdate(
      { tenantId },
      { $inc: { currentValue: 1 } },
      { new: true },
    ).exec();

    if (!doc) throw new Error("ReceiptCounter not found for tenant");

    return {
      receiptNumber: `${doc.prefix}-${doc.currentValue}`,
      currentValue: doc.currentValue,
    };
  }

  private toDomain(doc: IReceiptCounterDocument): ReceiptCounter {
    return ReceiptCounter.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      prefix: doc.prefix,
      currentValue: doc.currentValue,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
