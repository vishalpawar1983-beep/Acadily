import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { StudentContact, StudentEnrollment, StudentStatus } from '../domain/entities/Student.js';

export interface UpdateStudentRequest {
  tenantId: string;
  studentId: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  contact?: Partial<StudentContact>;
  dateOfBirth?: string;
  educationQualification?: string;
  enrollment?: Partial<{
    courseId: string;
    courseName: string;
    courseFees: number;
    discount: number;
    netFees: number;
    remainingFees: number;
    totalPaid: number;
    downPayment: number;
    dateOfJoining: string;
    installmentCount: number;
    installmentAmount: number;
  }>;
  status?: StudentStatus;
  image?: string;
  notes?: string;
}

export interface UpdateStudentResponse {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  contact: StudentContact;
  dateOfBirth?: Date;
  educationQualification?: string;
  enrollment: StudentEnrollment;
  status: StudentStatus;
  image?: string;
  notes?: string;
  updatedAt: Date;
}

export class UpdateStudent implements UseCase<UpdateStudentRequest, UpdateStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: UpdateStudentRequest): Promise<UpdateStudentResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    const enrollmentUpdate = request.enrollment
      ? {
          ...request.enrollment,
          dateOfJoining: request.enrollment.dateOfJoining
            ? new Date(request.enrollment.dateOfJoining)
            : undefined,
        }
      : undefined;

    student.updateDetails({
      firstName: request.firstName,
      lastName: request.lastName,
      fatherName: request.fatherName,
      contact: request.contact,
      dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : undefined,
      educationQualification: request.educationQualification,
      enrollment: enrollmentUpdate,
      status: request.status,
      image: request.image,
      notes: request.notes,
    });

    const updated = await this.studentRepo.update(student);

    return {
      id: updated.id,
      rollNumber: updated.rollNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      fatherName: updated.fatherName,
      contact: updated.contact,
      dateOfBirth: updated.dateOfBirth,
      educationQualification: updated.educationQualification,
      enrollment: updated.enrollment,
      status: updated.status,
      image: updated.image,
      notes: updated.notes,
      updatedAt: updated.updatedAt,
    };
  }
}
