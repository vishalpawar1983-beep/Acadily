import { CustomField } from '../domain/entities/CustomField.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  ICustomFieldRepository,
  FindAllCustomFieldsOptions,
} from '../domain/repositories/ICustomFieldRepository.js';
import {
  CustomFieldModel,
  type ICustomFieldDocument,
} from './CustomFieldModel.js';

export class MongoCustomFieldRepository implements ICustomFieldRepository {
  async findById(tenantId: string, id: string): Promise<CustomField | null> {
    const doc = await CustomFieldModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllCustomFieldsOptions = {},
  ): Promise<{ fields: CustomField[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.companyId !== undefined) filter.companyId = options.companyId;
    if (options.formType !== undefined) filter.formType = options.formType;
    if (options.formId !== undefined) filter.formId = options.formId;

    const [docs, total] = await Promise.all([
      CustomFieldModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      CustomFieldModel.countDocuments(filter).exec(),
    ]);

    return {
      fields: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(field: CustomField): Promise<CustomField> {
    const doc = await CustomFieldModel.create({
      _id: field.id,
      tenantId: field.tenantId,
      companyId: field.companyId,
      formType: field.formType,
      formId: field.formId,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      options: field.options,
      mandatory: field.mandatory,
      defaultValue: field.defaultValue,
      createdBy: field.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(field: CustomField): Promise<CustomField> {
    const doc = await CustomFieldModel.findOneAndUpdate(
      { _id: field.id, tenantId: field.tenantId },
      {
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        options: field.options,
        mandatory: field.mandatory,
        defaultValue: field.defaultValue,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('CustomField', field.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await CustomFieldModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: ICustomFieldDocument): CustomField {
    return CustomField.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      companyId: doc.companyId,
      formType: (doc.formType as 'admission' | 'enquiry') ?? 'admission',
      formId: doc.formId,
      fieldName: doc.fieldName,
      fieldType: doc.fieldType as any,
      options: doc.options,
      mandatory: doc.mandatory,
      defaultValue: doc.defaultValue,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
