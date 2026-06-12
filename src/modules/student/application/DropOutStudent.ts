import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DropOutStudentRequest {
  tenantId: string;
  studentId: string;
  message?: string;
}

export interface DropOutStudentResponse {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  status: string;
  notes?: string;
  updatedAt: Date;
}

export class DropOutStudent implements UseCase<DropOutStudentRequest, DropOutStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: DropOutStudentRequest): Promise<DropOutStudentResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    student.markAsDropout(request.message);
    const updated = await this.studentRepo.update(student);

    return {
      id: updated.id,
      rollNumber: updated.rollNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      status: updated.status,
      notes: updated.notes,
      updatedAt: updated.updatedAt,
    };
  }
}
