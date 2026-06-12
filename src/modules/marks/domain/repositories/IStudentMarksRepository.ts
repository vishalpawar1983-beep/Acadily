import type { StudentMarks } from '../entities/StudentMarks.js';

export interface FindAllMarksOptions {
  skip?: number;
  limit?: number;
  studentId?: string;
  courseId?: string;
  resultStatus?: string;
}

export interface IStudentMarksRepository {
  findById(tenantId: string, id: string): Promise<StudentMarks | null>;
  findByStudent(tenantId: string, studentId: string): Promise<StudentMarks[]>;
  findByStudentAndCourse(tenantId: string, studentId: string, courseId: string): Promise<StudentMarks | null>;
  findAll(
    tenantId: string,
    options?: FindAllMarksOptions,
  ): Promise<{ marks: StudentMarks[]; total: number }>;
  save(marks: StudentMarks): Promise<StudentMarks>;
  update(marks: StudentMarks): Promise<StudentMarks>;
}
