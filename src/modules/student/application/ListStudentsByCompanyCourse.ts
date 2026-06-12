import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import type { StudentStatus } from '../domain/entities/Student.js';

export interface ListStudentsByCompanyCourseRequest {
  tenantId: string;
  companyId: string;
  courseId: string;
  skip?: number;
  limit?: number;
  status?: StudentStatus;
  search?: string;
}

export interface ListStudentsByCompanyCourseResponse {
  students: Array<{
    id: string;
    rollNumber: string;
    firstName: string;
    lastName: string;
    contact: { mobile: string; email?: string; city?: string };
    enrollment: { courseId: string; courseName: string; netFees: number; remainingFees: number; totalPaid: number; companyId?: string; companyName?: string };
    status: StudentStatus;
    dateOfJoining: Date;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListStudentsByCompanyCourse implements UseCase<ListStudentsByCompanyCourseRequest, ListStudentsByCompanyCourseResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: ListStudentsByCompanyCourseRequest): Promise<ListStudentsByCompanyCourseResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { students, total } = await this.studentRepo.findByCompanyAndCourse(
      request.tenantId,
      request.companyId,
      request.courseId,
      {
        skip,
        limit,
        status: request.status,
        search: request.search,
      },
    );

    return {
      students: students.map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        contact: {
          mobile: s.contact.mobile,
          email: s.contact.email,
          city: s.contact.city,
        },
        enrollment: {
          courseId: s.enrollment.courseId,
          courseName: s.enrollment.courseName,
          netFees: s.enrollment.netFees,
          remainingFees: s.enrollment.remainingFees,
          totalPaid: s.enrollment.totalPaid,
          companyId: s.enrollment.companyId,
          companyName: s.enrollment.companyName,
        },
        status: s.status,
        dateOfJoining: s.enrollment.dateOfJoining,
        createdAt: s.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
