import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteSubmissionRequest {
  tenantId: string;
  formId: string;
  submissionId: string;
}

export interface DeleteSubmissionResponse {
  success: boolean;
}

export class DeleteSubmission implements UseCase<DeleteSubmissionRequest, DeleteSubmissionResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: DeleteSubmissionRequest): Promise<DeleteSubmissionResponse> {
    const submission = await this.repo.findSubmissionById(request.tenantId, request.submissionId);
    if (!submission || submission.formId !== request.formId) {
      throw new NotFoundError('FormSubmission', request.submissionId);
    }

    await this.repo.deleteSubmission(request.tenantId, request.submissionId);

    return { success: true };
  }
}
