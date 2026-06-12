import type { Subject } from '../entities/Subject.js';

export interface FindAllSubjectsOptions {
  skip?: number;
  limit?: number;
  courseId?: string;
}

export interface ISubjectRepository {
  findById(tenantId: string, id: string): Promise<Subject | null>;
  findByCourseId(tenantId: string, courseId: string): Promise<Subject[]>;
  findAll(
    tenantId: string,
    options?: FindAllSubjectsOptions,
  ): Promise<{ subjects: Subject[]; total: number }>;
  save(subject: Subject): Promise<Subject>;
  update(subject: Subject): Promise<Subject>;
  delete(tenantId: string, id: string): Promise<void>;
}
