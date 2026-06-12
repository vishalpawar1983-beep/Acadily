import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import type { FormFieldValue } from '../domain/entities/FormSubmission.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetSubmissionRequest {
  tenantId: string;
  formId: string;
  submissionId: string;
}

export interface GetSubmissionResponse {
  id: string;
  formId: string;
  values: FormFieldValue[];
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetSubmission implements UseCase<GetSubmissionRequest, GetSubmissionResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: GetSubmissionRequest): Promise<GetSubmissionResponse> {
    const submission = await this.repo.findSubmissionById(request.tenantId, request.submissionId);
    if (!submission || submission.formId !== request.formId) {
      throw new NotFoundError('FormSubmission', request.submissionId);
    }

    return {
      id: submission.id,
      formId: submission.formId,
      values: submission.values,
      addedBy: submission.addedBy,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }
}
