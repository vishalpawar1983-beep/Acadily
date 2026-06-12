import { FormLayout } from '../domain/entities/FormLayout.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IFormLayoutRepository } from '../domain/repositories/IFormLayoutRepository.js';
import {
  FormLayoutModel,
  type IFormLayoutDocument,
} from './FormLayoutModel.js';

export class MongoFormLayoutRepository implements IFormLayoutRepository {
  async findById(tenantId: string, id: string): Promise<FormLayout | null> {
    const doc = await FormLayoutModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByFormAndType(
    tenantId: string,
    formId: string,
    type: 'column' | 'row',
  ): Promise<FormLayout | null> {
    const doc = await FormLayoutModel.findOne({ tenantId, formId, type }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAllByType(
    tenantId: string,
    type: 'column' | 'row',
  ): Promise<FormLayout[]> {
    const docs = await FormLayoutModel.find({ tenantId, type }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(layout: FormLayout): Promise<FormLayout> {
    const doc = await FormLayoutModel.create({
      _id: layout.id,
      tenantId: layout.tenantId,
      formId: layout.formId,
      type: layout.type,
      items: layout.items,
      createdBy: layout.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(layout: FormLayout): Promise<FormLayout> {
    const doc = await FormLayoutModel.findOneAndUpdate(
      { _id: layout.id, tenantId: layout.tenantId },
      {
        items: layout.items,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('FormLayout', layout.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await FormLayoutModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: IFormLayoutDocument): FormLayout {
    return FormLayout.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      formId: doc.formId,
      type: doc.type as 'column' | 'row',
      items: doc.items.map((i) => ({
        id: i.id,
        name: i.name,
        order: i.order,
      })),
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
