import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../../student/domain/repositories/IStudentRepository.js';
import type { StudentContact } from '../../student/domain/entities/Student.js';

export interface GetNotPaidStudentsRequest {
  tenantId: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetNotPaidStudentsResponse {
  students: Array<{
    id: string;
    rollNumber: string;
    firstName: string;
    lastName: string;
    contact: StudentContact;
    enrollment: {
      courseId: string;
      courseName: string;
      netFees: number;
      remainingFees: number;
      totalPaid: number;
      dateOfJoining: Date;
    };
    status: string;
  }>;
  total: number;
}

export class GetNotPaidStudents
  implements UseCase<GetNotPaidStudentsRequest, GetNotPaidStudentsResponse>
{
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: GetNotPaidStudentsRequest): Promise<GetNotPaidStudentsResponse> {
    const students = await this.studentRepo.findUnpaidStudents(request.tenantId, {
      fromDate: request.fromDate ? new Date(request.fromDate) : undefined,
      toDate: request.toDate ? new Date(request.toDate) : undefined,
    });

    return {
      students: students.map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        contact: s.contact,
        enrollment: {
          courseId: s.enrollment.courseId,
          courseName: s.enrollment.courseName,
          netFees: s.enrollment.netFees,
          remainingFees: s.enrollment.remainingFees,
          totalPaid: s.enrollment.totalPaid,
          dateOfJoining: s.enrollment.dateOfJoining,
        },
        status: s.status,
      })),
      total: students.length,
    };
  }
}
