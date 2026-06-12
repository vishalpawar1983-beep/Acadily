import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';

export interface ListIssuesRequest {
  tenantId: string;
  studentId?: string;
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface ListIssuesResponse {
  issues: Array<{
    id: string;
    studentId: string;
    date: Date;
    particulars: string;
    addedBy: string;
    showOnDashboard: boolean;
    status: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListIssues implements UseCase<ListIssuesRequest, ListIssuesResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: ListIssuesRequest): Promise<ListIssuesResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { issues, total } = request.studentId
      ? await this.repo.findByStudent(request.tenantId, request.studentId, { skip, limit, status: request.status, search: request.search })
      : await this.repo.findAll(request.tenantId, { skip, limit, status: request.status, search: request.search });

    return {
      issues: issues.map((i) => ({
        id: i.id,
        studentId: i.studentId,
        date: i.date,
        particulars: i.particulars,
        addedBy: i.addedBy,
        showOnDashboard: i.showOnDashboard,
        status: i.status,
        createdAt: i.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
