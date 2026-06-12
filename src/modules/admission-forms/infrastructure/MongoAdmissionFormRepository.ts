import { AdmissionForm } from '../domain/entities/AdmissionForm.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IAdmissionFormRepository } from '../domain/repositories/IAdmissionFormRepository.js';
import { AdmissionFormModel, type IAdmissionFormDocument } from './AdmissionFormModel.js';

export class MongoAdmissionFormRepository implements IAdmissionFormRepository {
  async findById(tenantId: string, id: string): Promise<AdmissionForm | null> {
    const doc = await AdmissionFormModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<AdmissionForm | null> {
    const doc = await AdmissionFormModel.findOne({ tenantId, studentId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(form: AdmissionForm): Promise<AdmissionForm> {
    const doc = await AdmissionFormModel.create({
      _id: form.id,
      tenantId: form.tenantId,
      studentId: form.studentId,
      formData: form.formData,
      companyId: form.companyId,
      showNotesDashBoard: form.showNotesDashBoard,
      createdBy: form.createdBy,
    });
    return this.toDomain(doc);
  }

  async update(form: AdmissionForm): Promise<AdmissionForm> {
    const doc = await AdmissionFormModel.findOneAndUpdate(
      { _id: form.id, tenantId: form.tenantId },
      {
        formData: form.formData,
        showNotesDashBoard: form.showNotesDashBoard,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('AdmissionForm', form.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IAdmissionFormDocument): AdmissionForm {
    return AdmissionForm.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      studentId: doc.studentId,
      formData: doc.formData as Record<string, unknown>,
      companyId: doc.companyId,
      showNotesDashBoard: doc.showNotesDashBoard,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
