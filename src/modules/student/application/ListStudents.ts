import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import type { StudentStatus } from '../domain/entities/Student.js';

export interface ListStudentsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  status?: StudentStatus;
  search?: string;
}

export interface ListStudentsResponse {
  students: Array<{
    id: string;
    rollNumber: string;
    firstName: string;
    lastName: string;
    fatherName?: string;
    contact: { mobile: string; phone?: string; email?: string; address?: string; city?: string };
    dateOfBirth?: Date;
    educationQualification?: string;
    enrollment: {
      courseId: string; courseName: string;
      courseFees?: number; discount?: number; netFees: number; remainingFees: number; totalPaid: number;
      downPayment?: number; dateOfJoining?: Date; installmentCount?: number; installmentAmount?: number;
    };
    status: StudentStatus;
    image?: string;
    companyName?: string;
    dateOfJoining: Date;
    createdAt: Date;
    updatedAt?: Date;
    _legacyId?: string;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListStudents implements UseCase<ListStudentsRequest, ListStudentsResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: ListStudentsRequest): Promise<ListStudentsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { students, total } = await this.studentRepo.findAll(request.tenantId, {
      skip,
      limit,
      status: request.status,
      search: request.search,
    });

    return {
      students: students.map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        fatherName: s.fatherName,
        contact: {
          mobile: s.contact.mobile,
          phone: s.contact.phone,
          email: s.contact.email,
          address: s.contact.address,
          city: s.contact.city,
        },
        dateOfBirth: s.dateOfBirth,
        educationQualification: s.educationQualification,
        enrollment: {
          courseId: s.enrollment.courseId,
          courseName: s.enrollment.courseName,
          courseFees: s.enrollment.courseFees,
          discount: s.enrollment.discount,
          netFees: s.enrollment.netFees,
          remainingFees: s.enrollment.remainingFees,
          totalPaid: s.enrollment.totalPaid,
          downPayment: s.enrollment.downPayment,
          dateOfJoining: s.enrollment.dateOfJoining,
          installmentCount: s.enrollment.installmentCount,
          installmentAmount: s.enrollment.installmentAmount,
        },
        status: s.status,
        image: s.image,
        companyName: s.enrollment.companyId,
        dateOfJoining: s.enrollment.dateOfJoining,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        _legacyId: (s as any)._legacyId as string | undefined,
      })),
      total,
      skip,
      limit,
    };
  }
}
