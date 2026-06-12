import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteIssueRequest {
  tenantId: string;
  issueId: string;
}

export interface DeleteIssueResponse {
  success: boolean;
}

export class DeleteIssue implements UseCase<DeleteIssueRequest, DeleteIssueResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: DeleteIssueRequest): Promise<DeleteIssueResponse> {
    const issue = await this.repo.findById(request.tenantId, request.issueId);
    if (!issue) {
      throw new NotFoundError('StudentIssue', request.issueId);
    }

    await this.repo.delete(request.tenantId, request.issueId);

    return { success: true };
  }
}
