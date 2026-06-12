import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITeacherRepository } from '../domain/repositories/ITeacherRepository.js';
import { NotFoundError, ConflictError } from '../../../shared/domain/errors.js';

export interface UpdateTeacherRequest {
  tenantId: string;
  teacherId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
  qualification?: string;
  experience?: number;
  address?: string;
  isActive?: boolean;
  joiningDate?: string;
}

export interface UpdateTeacherResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  qualification: string;
  experience: number;
  address: string;
  isActive: boolean;
  joiningDate: Date;
  updatedAt: Date;
}

export class UpdateTeacher implements UseCase<UpdateTeacherRequest, UpdateTeacherResponse> {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(request: UpdateTeacherRequest): Promise<UpdateTeacherResponse> {
    const teacher = await this.teacherRepo.findById(request.tenantId, request.teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher', request.teacherId);
    }

    if (request.email && request.email !== teacher.email) {
      const existing = await this.teacherRepo.findByEmail(request.tenantId, request.email);
      if (existing) {
        throw new ConflictError(`Teacher with email ${request.email} already exists`);
      }
    }

    teacher.updateDetails({
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      subjects: request.subjects,
      qualification: request.qualification,
      experience: request.experience,
      address: request.address,
      joiningDate: request.joiningDate ? new Date(request.joiningDate) : undefined,
    });

    if (request.isActive === true) teacher.activate();
    if (request.isActive === false) teacher.deactivate();

    const updated = await this.teacherRepo.update(teacher);

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone,
      subjects: updated.subjects,
      qualification: updated.qualification,
      experience: updated.experience,
      address: updated.address,
      isActive: updated.isActive,
      joiningDate: updated.joiningDate,
      updatedAt: updated.updatedAt,
    };
  }
}
