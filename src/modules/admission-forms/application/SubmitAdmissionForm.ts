import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IAdmissionFormRepository } from '../domain/repositories/IAdmissionFormRepository.js';
import { AdmissionForm } from '../domain/entities/AdmissionForm.js';

export interface SubmitAdmissionFormRequest {
  tenantId: string;
  studentId: string;
  formData: Record<string, unknown>;
  companyId: string;
  createdBy: string;
}

export interface SubmitAdmissionFormResponse {
  id: string;
  studentId: string;
  formData: Record<string, unknown>;
  companyId: string;
  showNotesDashBoard: boolean;
  createdAt: Date;
}

export class SubmitAdmissionForm
  implements UseCase<SubmitAdmissionFormRequest, SubmitAdmissionFormResponse>
{
  constructor(private readonly repo: IAdmissionFormRepository) {}

  async execute(request: SubmitAdmissionFormRequest): Promise<SubmitAdmissionFormResponse> {
    const form = AdmissionForm.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      formData: request.formData,
      companyId: request.companyId,
      createdBy: request.createdBy,
    });

    const saved = await this.repo.save(form);

    return {
      id: saved.id,
      studentId: saved.studentId,
      formData: saved.formData,
      companyId: saved.companyId,
      showNotesDashBoard: saved.showNotesDashBoard,
      createdAt: saved.createdAt,
    };
  }
}
