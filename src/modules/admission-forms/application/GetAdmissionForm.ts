import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IAdmissionFormRepository } from '../domain/repositories/IAdmissionFormRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetAdmissionFormRequest {
  tenantId: string;
  studentId: string;
}

export interface GetAdmissionFormResponse {
  id: string;
  studentId: string;
  formData: Record<string, unknown>;
  companyId: string;
  showNotesDashBoard: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetAdmissionForm
  implements UseCase<GetAdmissionFormRequest, GetAdmissionFormResponse>
{
  constructor(private readonly repo: IAdmissionFormRepository) {}

  async execute(request: GetAdmissionFormRequest): Promise<GetAdmissionFormResponse> {
    const form = await this.repo.findByStudent(request.tenantId, request.studentId);
    if (!form) {
      throw new NotFoundError('AdmissionForm', request.studentId);
    }

    return {
      id: form.id,
      studentId: form.studentId,
      formData: form.formData,
      companyId: form.companyId,
      showNotesDashBoard: form.showNotesDashBoard,
      createdBy: form.createdBy,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }
}
