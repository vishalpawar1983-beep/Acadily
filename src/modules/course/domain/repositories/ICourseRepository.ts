import { Course } from '../entities/Course.js';

export interface ICourseRepository {
  findById(tenantId: string, id: string): Promise<Course | null>;
  findAll(
    tenantId: string,
    options?: { skip?: number; limit?: number; category?: string },
  ): Promise<{ courses: Course[]; total: number }>;
  save(course: Course): Promise<Course>;
  update(course: Course): Promise<Course>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
