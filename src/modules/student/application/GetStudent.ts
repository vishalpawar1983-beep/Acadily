import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { StudentContact, StudentEnrollment, StudentStatus } from '../domain/entities/Student.js';

export interface GetStudentRequest {
  tenantId: string;
  studentId: string;
}

export interface GetStudentResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export class GetStudent implements UseCase<GetStudentRequest, GetStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: GetStudentRequest): Promise<GetStudentResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    return {
      id: student.id,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      fatherName: student.fatherName,
      contact: student.contact,
      dateOfBirth: student.dateOfBirth,
      educationQualification: student.educationQualification,
      enrollment: student.enrollment,
      status: student.status,
      image: student.image,
      notes: student.notes,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
