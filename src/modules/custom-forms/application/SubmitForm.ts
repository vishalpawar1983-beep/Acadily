import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { FormSubmission, type FormFieldValue } from '../domain/entities/FormSubmission.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface SubmitFormRequest {
  tenantId: string;
  formId: string;
  values: FormFieldValue[];
  addedBy: string;
}

export interface SubmitFormResponse {
  id: string;
  formId: string;
  values: FormFieldValue[];
  addedBy: string;
  createdAt: Date;
}

export class SubmitForm implements UseCase<SubmitFormRequest, SubmitFormResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: SubmitFormRequest): Promise<SubmitFormResponse> {
    const form = await this.repo.findFormById(request.tenantId, request.formId);
    if (!form) {
      throw new NotFoundError('FormDefinition', request.formId);
    }

    const submission = FormSubmission.create({
      tenantId: request.tenantId,
      formId: request.formId,
      values: request.values,
      addedBy: request.addedBy,
    });

    const saved = await this.repo.saveSubmission(submission);

    return {
      id: saved.id,
      formId: saved.formId,
      values: saved.values,
      addedBy: saved.addedBy,
      createdAt: saved.createdAt,
    };
  }
}
