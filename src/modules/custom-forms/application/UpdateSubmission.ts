import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import type { FormFieldValue } from '../domain/entities/FormSubmission.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateSubmissionRequest {
  tenantId: string;
  formId: string;
  submissionId: string;
  values?: FormFieldValue[];
}

export interface UpdateSubmissionResponse {
  id: string;
  formId: string;
  values: FormFieldValue[];
  addedBy: string;
  updatedAt: Date;
}

export class UpdateSubmission implements UseCase<UpdateSubmissionRequest, UpdateSubmissionResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: UpdateSubmissionRequest): Promise<UpdateSubmissionResponse> {
    const submission = await this.repo.findSubmissionById(request.tenantId, request.submissionId);
    if (!submission || submission.formId !== request.formId) {
      throw new NotFoundError('FormSubmission', request.submissionId);
    }

    submission.updateDetails({
      values: request.values,
    });

    const updated = await this.repo.updateSubmission(submission);

    return {
      id: updated.id,
      formId: updated.formId,
      values: updated.values,
      addedBy: updated.addedBy,
      updatedAt: updated.updatedAt,
    };
  }
}
