import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetDashboardByStudentRequest {
  tenantId: string;
  studentId: string;
}

export interface GetDashboardByStudentResponse {
  id: string;
  studentId: string;
  showStudent: boolean;
  updatedAt: Date;
}

export class GetDashboardByStudent
  implements UseCase<GetDashboardByStudentRequest, GetDashboardByStudentResponse>
{
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: GetDashboardByStudentRequest): Promise<GetDashboardByStudentResponse> {
    const dashboard = await this.repo.findDashboardByStudent(request.tenantId, request.studentId);
    if (!dashboard) {
      throw new NotFoundError('IssueDashboard', request.studentId);
    }

    return {
      id: dashboard.id,
      studentId: dashboard.studentId,
      showStudent: dashboard.showStudent,
      updatedAt: dashboard.updatedAt,
    };
  }
}
