import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';

export interface ListDashboardRequest {
  tenantId: string;
}

export interface ListDashboardResponse {
  settings: Array<{
    id: string;
    studentId: string;
    showStudent: boolean;
    updatedAt: Date;
  }>;
}

export class ListDashboard implements UseCase<ListDashboardRequest, ListDashboardResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: ListDashboardRequest): Promise<ListDashboardResponse> {
    const dashboards = await this.repo.findAllDashboard(request.tenantId);

    return {
      settings: dashboards.map((d) => ({
        id: d.id,
        studentId: d.studentId,
        showStudent: d.showStudent,
        updatedAt: d.updatedAt,
      })),
    };
  }
}
