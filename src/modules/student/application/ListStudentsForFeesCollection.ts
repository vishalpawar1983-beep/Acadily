import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import type { StudentStatus } from '../domain/entities/Student.js';

export interface ListStudentsForFeesCollectionRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListStudentsForFeesCollectionResponse {
  students: Array<{
    id: string;
    rollNumber: string;
    firstName: string;
    lastName: string;
    contact: { mobile: string; email?: string; city?: string };
    enrollment: {
      courseId: string;
      courseName: string;
      courseFees: number;
      netFees: number;
      remainingFees: number;
      totalPaid: number;
      downPayment: number;
      installmentCount: number;
      installmentAmount: number;
      companyId?: string;
      companyName?: string;
    };
    status: StudentStatus;
    dateOfJoining: Date;
    createdAt: Date;
  }>;
  total: number;
}

export class ListStudentsForFeesCollection implements UseCase<ListStudentsForFeesCollectionRequest, ListStudentsForFeesCollectionResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: ListStudentsForFeesCollectionRequest): Promise<ListStudentsForFeesCollectionResponse> {
    const { students, total } = await this.studentRepo.findAll(request.tenantId, {
      skip: request.skip ?? 0,
      limit: request.limit ?? 1000,
    });

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
          courseFees: s.enrollment.courseFees,
          netFees: s.enrollment.netFees,
          remainingFees: s.enrollment.remainingFees,
          totalPaid: s.enrollment.totalPaid,
          downPayment: s.enrollment.downPayment,
          installmentCount: s.enrollment.installmentCount,
          installmentAmount: s.enrollment.installmentAmount,
          companyId: s.enrollment.companyId,
          companyName: s.enrollment.companyName,
        },
        status: s.status,
        dateOfJoining: s.enrollment.dateOfJoining,
        createdAt: s.createdAt,
      })),
      total,
    };
  }
}
