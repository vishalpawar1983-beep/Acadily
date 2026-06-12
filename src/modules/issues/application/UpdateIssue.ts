import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateIssueRequest {
  tenantId: string;
  issueId: string;
  particulars?: string;
  date?: string;
  showOnDashboard?: boolean;
  status?: 'open' | 'inProgress' | 'resolved' | 'closed';
}

export interface UpdateIssueResponse {
  id: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  showOnDashboard: boolean;
  status: string;
  updatedAt: Date;
}

export class UpdateIssue implements UseCase<UpdateIssueRequest, UpdateIssueResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: UpdateIssueRequest): Promise<UpdateIssueResponse> {
    const issue = await this.repo.findById(request.tenantId, request.issueId);
    if (!issue) {
      throw new NotFoundError('StudentIssue', request.issueId);
    }

    issue.updateDetails({
      particulars: request.particulars,
      date: request.date ? new Date(request.date) : undefined,
      showOnDashboard: request.showOnDashboard,
      status: request.status,
    });

    const updated = await this.repo.update(issue);

    return {
      id: updated.id,
      studentId: updated.studentId,
      date: updated.date,
      particulars: updated.particulars,
      addedBy: updated.addedBy,
      showOnDashboard: updated.showOnDashboard,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }
}
