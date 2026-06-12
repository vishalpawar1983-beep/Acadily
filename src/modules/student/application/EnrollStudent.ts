import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { Student } from '../domain/entities/Student.js';
import type { StudentContact, StudentEnrollment } from '../domain/entities/Student.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface EnrollStudentRequest {
  tenantId: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  contact: StudentContact;
  dateOfBirth?: string;
  educationQualification?: string;
  enrollment: {
    courseId: string;
    courseName: string;
    courseFees: number;
    discount?: number;
    netFees: number;
    remainingFees?: number;
    totalPaid?: number;
    downPayment?: number;
    dateOfJoining: string;
    installmentCount?: number;
    installmentAmount?: number;
  };
  image?: string;
  notes?: string;
}

export interface EnrollStudentResponse {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  status: string;
  enrollment: StudentEnrollment;
  createdAt: Date;
}

export class EnrollStudent implements UseCase<EnrollStudentRequest, EnrollStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: EnrollStudentRequest): Promise<EnrollStudentResponse> {
    const rollNumber = await this.generateRollNumber(request.tenantId);

    const existing = await this.studentRepo.findByRollNumber(request.tenantId, rollNumber);
    if (existing) {
      throw new ConflictError(`Student with roll number ${rollNumber} already exists`);
    }

    const enrollment: StudentEnrollment = {
      courseId: request.enrollment.courseId,
      courseName: request.enrollment.courseName,
      courseFees: request.enrollment.courseFees,
      discount: request.enrollment.discount ?? 0,
      netFees: request.enrollment.netFees,
      remainingFees: request.enrollment.remainingFees ?? request.enrollment.netFees,
      totalPaid: request.enrollment.totalPaid ?? 0,
      downPayment: request.enrollment.downPayment ?? 0,
      dateOfJoining: new Date(request.enrollment.dateOfJoining),
      installmentCount: request.enrollment.installmentCount ?? 0,
      installmentAmount: request.enrollment.installmentAmount ?? 0,
    };

    const student = Student.create({
      tenantId: request.tenantId,
      rollNumber,
      firstName: request.firstName,
      lastName: request.lastName,
      fatherName: request.fatherName,
      contact: request.contact,
      dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : undefined,
      educationQualification: request.educationQualification,
      enrollment,
      image: request.image,
      notes: request.notes,
    });

    const saved = await this.studentRepo.save(student);

    return {
      id: saved.id,
      rollNumber: saved.rollNumber,
      firstName: saved.firstName,
      lastName: saved.lastName,
      status: saved.status,
      enrollment: saved.enrollment,
      createdAt: saved.createdAt,
    };
  }

  private async generateRollNumber(tenantId: string): Promise<string> {
    const count = await this.studentRepo.count(tenantId);
    const sequence = (count + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear().toString().slice(-2);
    return `STU-${year}-${sequence}`;
  }
}
