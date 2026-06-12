import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { IssueDashboard } from '../domain/entities/IssueDashboard.js';

export interface ToggleDashboardRequest {
  tenantId: string;
  studentId: string;
  showStudent: boolean;
}

export interface ToggleDashboardResponse {
  id: string;
  studentId: string;
  showStudent: boolean;
  updatedAt: Date;
}

export class ToggleDashboard implements UseCase<ToggleDashboardRequest, ToggleDashboardResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: ToggleDashboardRequest): Promise<ToggleDashboardResponse> {
    const dashboard = IssueDashboard.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      showStudent: request.showStudent,
    });

    const result = await this.repo.upsertDashboard(dashboard);

    return {
      id: result.id,
      studentId: result.studentId,
      showStudent: result.showStudent,
      updatedAt: result.updatedAt,
    };
  }
}
