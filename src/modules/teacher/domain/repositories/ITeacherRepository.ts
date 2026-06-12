import { Teacher } from '../entities/Teacher.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface ITeacherRepository {
  findById(tenantId: string, id: string): Promise<Teacher | null>;
  findByEmail(tenantId: string, email: string): Promise<Teacher | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ teachers: Teacher[]; total: number }>;
  save(teacher: Teacher): Promise<Teacher>;
  update(teacher: Teacher): Promise<Teacher>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string, filter?: { isActive?: boolean }): Promise<number>;
}
