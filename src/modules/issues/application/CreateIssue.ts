import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentIssueRepository } from '../domain/repositories/IStudentIssueRepository.js';
import { StudentIssue } from '../domain/entities/StudentIssue.js';

export interface CreateIssueRequest {
  tenantId: string;
  studentId: string;
  date?: string;
  particulars: string;
  addedBy: string;
  showOnDashboard?: boolean;
  status?: 'open' | 'inProgress' | 'resolved' | 'closed';
}

export interface CreateIssueResponse {
  id: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  showOnDashboard: boolean;
  status: string;
  createdAt: Date;
}

export class CreateIssue implements UseCase<CreateIssueRequest, CreateIssueResponse> {
  constructor(private readonly repo: IStudentIssueRepository) {}

  async execute(request: CreateIssueRequest): Promise<CreateIssueResponse> {
    const issue = StudentIssue.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      date: request.date,
      particulars: request.particulars,
      addedBy: request.addedBy,
      showOnDashboard: request.showOnDashboard,
      status: request.status,
    });

    const saved = await this.repo.save(issue);

    return {
      id: saved.id,
      studentId: saved.studentId,
      date: saved.date,
      particulars: saved.particulars,
      addedBy: saved.addedBy,
      showOnDashboard: saved.showOnDashboard,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }
}
