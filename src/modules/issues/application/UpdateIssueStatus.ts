import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateIssueStatusRequest {
  tenantId: string;
  issueId: string;
  showNotesDashBoard: boolean;
}

export interface UpdateIssueStatusResponse {
  id: string;
  studentId: string;
  showOnDashboard: boolean;
  updatedAt: Date;
}

export class UpdateIssueStatus
  implements UseCase<UpdateIssueStatusRequest, UpdateIssueStatusResponse>
{
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: UpdateIssueStatusRequest): Promise<UpdateIssueStatusResponse> {
    const issue = await this.repo.findById(request.tenantId, request.issueId);
    if (!issue) {
      throw new NotFoundError('StudentIssue', request.issueId);
    }

    issue.updateDetails({
      showOnDashboard: request.showNotesDashBoard,
    });

    const updated = await this.repo.update(issue);

    return {
      id: updated.id,
      studentId: updated.studentId,
      showOnDashboard: updated.showOnDashboard,
      updatedAt: updated.updatedAt,
    };
  }
}
