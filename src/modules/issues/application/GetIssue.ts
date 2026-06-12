import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetIssueRequest {
  tenantId: string;
  issueId: string;
}

export interface GetIssueResponse {
  id: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  showOnDashboard: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetIssue implements UseCase<GetIssueRequest, GetIssueResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: GetIssueRequest): Promise<GetIssueResponse> {
    const issue = await this.repo.findById(request.tenantId, request.issueId);
    if (!issue) {
      throw new NotFoundError('StudentIssue', request.issueId);
    }

    return {
      id: issue.id,
      studentId: issue.studentId,
      date: issue.date,
      particulars: issue.particulars,
      addedBy: issue.addedBy,
      showOnDashboard: issue.showOnDashboard,
      status: issue.status,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }
}
