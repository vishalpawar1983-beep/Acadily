import { StudentIssue } from '../entities/StudentIssue.js';
import type { IssueDashboard } from '../entities/IssueDashboard.js';

export interface FindAllIssuesOptions {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface IStudentIssueRepository {
  findById(tenantId: string, id: string): Promise<StudentIssue | null>;
  findByStudent(
    tenantId: string,
    studentId: string,
    options?: FindAllIssuesOptions,
  ): Promise<{ issues: StudentIssue[]; total: number }>;
  findAll(
    tenantId: string,
    options?: FindAllIssuesOptions,
  ): Promise<{ issues: StudentIssue[]; total: number }>;
  save(issue: StudentIssue): Promise<StudentIssue>;
  update(issue: StudentIssue): Promise<StudentIssue>;
  delete(tenantId: string, id: string): Promise<void>;

  // Dashboard
  upsertDashboard(dashboard: IssueDashboard): Promise<IssueDashboard>;
  findAllDashboard(tenantId: string): Promise<IssueDashboard[]>;
  findDashboardByStudent(tenantId: string, studentId: string): Promise<IssueDashboard | null>;
}
