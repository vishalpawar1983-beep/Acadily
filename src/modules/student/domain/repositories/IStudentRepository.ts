import { Student } from '../entities/Student.js';
import type { StudentStatus } from '../entities/Student.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  status?: StudentStatus;
  search?: string;
}

export interface IStudentRepository {
  findById(tenantId: string, id: string): Promise<Student | null>;
  findByRollNumber(tenantId: string, rollNumber: string): Promise<Student | null>;
  findByEmail(tenantId: string, email: string): Promise<Student | null>;
  findByCompany(
    tenantId: string,
    companyId: string,
    options?: FindAllOptions,
  ): Promise<{ students: Student[]; total: number }>;
  findByCompanyAndCourse(
    tenantId: string,
    companyId: string,
    courseId: string,
    options?: FindAllOptions,
  ): Promise<{ students: Student[]; total: number }>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ students: Student[]; total: number }>;
  save(student: Student): Promise<Student>;
  update(student: Student): Promise<Student>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string, filter?: { status?: StudentStatus }): Promise<number>;
  findUnpaidStudents(
    tenantId: string,
    options?: { fromDate?: Date; toDate?: Date },
  ): Promise<Student[]>;
}
