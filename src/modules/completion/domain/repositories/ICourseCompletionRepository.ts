import type { CourseCompletion } from '../entities/CourseCompletion.js';

export interface FindAllCompletionsOptions {
  skip?: number;
  limit?: number;
  studentId?: string;
  courseId?: string;
  status?: string;
}

export interface ICourseCompletionRepository {
  findById(tenantId: string, id: string): Promise<CourseCompletion | null>;
  findByStudent(tenantId: string, studentId: string): Promise<CourseCompletion[]>;
  findAll(
    tenantId: string,
    options?: FindAllCompletionsOptions,
  ): Promise<{ completions: CourseCompletion[]; total: number }>;
  save(completion: CourseCompletion): Promise<CourseCompletion>;
  update(completion: CourseCompletion): Promise<CourseCompletion>;
}
