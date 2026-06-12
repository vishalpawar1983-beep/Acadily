import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITeacherRepository } from '../domain/repositories/ITeacherRepository.js';
import { Teacher } from '../domain/entities/Teacher.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateTeacherRequest {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects?: string[];
  qualification: string;
  experience?: number;
  address: string;
  joiningDate?: string;
}

export interface CreateTeacherResponse {
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
  createdAt: Date;
}

export class CreateTeacher implements UseCase<CreateTeacherRequest, CreateTeacherResponse> {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(request: CreateTeacherRequest): Promise<CreateTeacherResponse> {
    const existing = await this.teacherRepo.findByEmail(request.tenantId, request.email);
    if (existing) {
      throw new ConflictError(`Teacher with email ${request.email} already exists`);
    }

    const teacher = Teacher.create({
      tenantId: request.tenantId,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      subjects: request.subjects,
      qualification: request.qualification,
      experience: request.experience,
      address: request.address,
      joiningDate: request.joiningDate,
    });

    const saved = await this.teacherRepo.save(teacher);

    return {
      id: saved.id,
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      phone: saved.phone,
      subjects: saved.subjects,
      qualification: saved.qualification,
      experience: saved.experience,
      address: saved.address,
      isActive: saved.isActive,
      joiningDate: saved.joiningDate,
      createdAt: saved.createdAt,
    };
  }
}
