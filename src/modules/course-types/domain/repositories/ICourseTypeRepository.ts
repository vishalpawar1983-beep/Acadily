import { CourseType } from '../entities/CourseType.js';

export interface ICourseTypeRepository {
  findById(tenantId: string, id: string): Promise<CourseType | null>;
  findAll(
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<{ courseTypes: CourseType[]; total: number }>;
  save(courseType: CourseType): Promise<CourseType>;
  update(courseType: CourseType): Promise<CourseType>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
