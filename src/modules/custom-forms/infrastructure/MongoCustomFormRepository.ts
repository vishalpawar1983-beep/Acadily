import { FormDefinition } from '../domain/entities/FormDefinition.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { FormSubmission } from '../domain/entities/FormSubmission.js';
import { DefaultSelect } from '../domain/entities/DefaultSelect.js';
import type {
  ICustomFormRepository,
  FindAllFormsOptions,
  FindSubmissionsOptions,
} from '../domain/repositories/ICustomFormRepository.js';
import {
  FormDefinitionModel,
  FormSubmissionModel,
  DefaultSelectModel,
  type IFormDefinitionDocument,
  type IFormSubmissionDocument,
  type IDefaultSelectDocument,
} from './CustomFormModel.js';

export class MongoCustomFormRepository implements ICustomFormRepository {
  // ── Forms ──────────────────────────────────────────────────────────

  async findFormById(tenantId: string, id: string): Promise<FormDefinition | null> {
    const doc = await FormDefinitionModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toFormDomain(doc) : null;
  }

  async findAllForms(
    tenantId: string,
    options: FindAllFormsOptions = {},
  ): Promise<{ forms: FormDefinition[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;

    const [docs, total] = await Promise.all([
      FormDefinitionModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      FormDefinitionModel.countDocuments(filter).exec(),
    ]);

    return {
      forms: docs.map((doc) => this.toFormDomain(doc)),
      total,
    };
  }

  async saveForm(form: FormDefinition): Promise<FormDefinition> {
    const doc = await FormDefinitionModel.create({
      _id: form.id,
      tenantId: form.tenantId,
      formName: form.formName,
      fields: form.fields,
      isActive: form.isActive,
    });
    return this.toFormDomain(doc);
  }

  async updateForm(form: FormDefinition): Promise<FormDefinition> {
    const doc = await FormDefinitionModel.findOneAndUpdate(
      { _id: form.id, tenantId: form.tenantId },
      {
        formName: form.formName,
        fields: form.fields,
        isActive: form.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('FormDefinition', form.id);
    return this.toFormDomain(doc);
  }

  async deleteForm(tenantId: string, id: string): Promise<void> {
    await FormDefinitionModel.deleteOne({ _id: id, tenantId }).exec();
  }

  // ── Submissions ────────────────────────────────────────────────────

  async findSubmissionById(tenantId: string, id: string): Promise<FormSubmission | null> {
    const doc = await FormSubmissionModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toSubmissionDomain(doc) : null;
  }

  async findSubmissionsByForm(
    tenantId: string,
    formId: string,
    options: FindSubmissionsOptions = {},
  ): Promise<{ submissions: FormSubmission[]; total: number }> {
    const filter = { tenantId, formId };

    const [docs, total] = await Promise.all([
      FormSubmissionModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      FormSubmissionModel.countDocuments(filter).exec(),
    ]);

    return {
      submissions: docs.map((doc) => this.toSubmissionDomain(doc)),
      total,
    };
  }

  async saveSubmission(submission: FormSubmission): Promise<FormSubmission> {
    const doc = await FormSubmissionModel.create({
      _id: submission.id,
      tenantId: submission.tenantId,
      formId: submission.formId,
      values: submission.values,
      addedBy: submission.addedBy,
    });
    return this.toSubmissionDomain(doc);
  }

  async updateSubmission(submission: FormSubmission): Promise<FormSubmission> {
    const doc = await FormSubmissionModel.findOneAndUpdate(
      { _id: submission.id, tenantId: submission.tenantId },
      {
        values: submission.values,
        addedBy: submission.addedBy,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('FormSubmission', submission.id);
    return this.toSubmissionDomain(doc);
  }

  async deleteSubmission(tenantId: string, id: string): Promise<void> {
    await FormSubmissionModel.deleteOne({ _id: id, tenantId }).exec();
  }

  // ── Default Selects ───────────────────────────────────────────────

  async findSelectById(tenantId: string, id: string): Promise<DefaultSelect | null> {
    const doc = await DefaultSelectModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toSelectDomain(doc) : null;
  }

  async findAllSelects(
    tenantId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ selects: DefaultSelect[]; total: number }> {
    const filter = { tenantId };
    const [docs, total] = await Promise.all([
      DefaultSelectModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      DefaultSelectModel.countDocuments(filter).exec(),
    ]);

    return {
      selects: docs.map((d) => this.toSelectDomain(d)),
      total,
    };
  }

  async saveSelect(select: DefaultSelect): Promise<DefaultSelect> {
    const doc = await DefaultSelectModel.create({
      _id: select.id,
      tenantId: select.tenantId,
      selectName: select.selectName,
      options: select.options,
      mandatory: select.mandatory,
    });
    return this.toSelectDomain(doc);
  }

  async updateSelect(select: DefaultSelect): Promise<DefaultSelect> {
    const doc = await DefaultSelectModel.findOneAndUpdate(
      { _id: select.id, tenantId: select.tenantId },
      {
        selectName: select.selectName,
        options: select.options,
        mandatory: select.mandatory,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('DefaultSelect', select.id);
    return this.toSelectDomain(doc);
  }

  // ── Mappers ────────────────────────────────────────────────────────

  private toFormDomain(doc: IFormDefinitionDocument): FormDefinition {
    return FormDefinition.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      formName: doc.formName,
      fields: doc.fields.map((f) => ({
        name: f.name,
        type: f.type as FormDefinition['fields'][number]['type'],
        options: f.options,
        mandatory: f.mandatory,
        headerView: f.headerView,
      })),
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toSelectDomain(doc: IDefaultSelectDocument): DefaultSelect {
    return DefaultSelect.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      selectName: doc.selectName,
      options: doc.options,
      mandatory: doc.mandatory,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toSubmissionDomain(doc: IFormSubmissionDocument): FormSubmission {
    return FormSubmission.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      formId: doc.formId,
      values: doc.values.map((v) => ({
        fieldName: v.fieldName,
        fieldType: v.fieldType,
        value: v.value,
      })),
      addedBy: doc.addedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
