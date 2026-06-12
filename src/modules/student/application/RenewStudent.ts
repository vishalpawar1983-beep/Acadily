import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { StudentEnrollment } from '../domain/entities/Student.js';

export interface RenewStudentRequest {
  tenantId: string;
  studentId: string;
  extraFees: number;
  noOfInstallments: number;
  duration: number;
}

export interface RenewStudentResponse {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  enrollment: StudentEnrollment;
  updatedAt: Date;
}

export class RenewStudent implements UseCase<RenewStudentRequest, RenewStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: RenewStudentRequest): Promise<RenewStudentResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    if (student.enrollment.remainingFees !== 0) {
      throw new ValidationError('Cannot renew: student still has remaining course fees');
    }

    const newNetFees = student.enrollment.netFees + request.extraFees;
    const installmentAmount =
      request.noOfInstallments > 0 ? request.extraFees / request.noOfInstallments : 0;

    student.updateDetails({
      enrollment: {
        netFees: newNetFees,
        remainingFees: request.extraFees,
        installmentCount: request.noOfInstallments,
        installmentAmount,
      },
      status: 'active',
    });

    const updated = await this.studentRepo.update(student);

    return {
      id: updated.id,
      rollNumber: updated.rollNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      enrollment: updated.enrollment,
      updatedAt: updated.updatedAt,
    };
  }
}
