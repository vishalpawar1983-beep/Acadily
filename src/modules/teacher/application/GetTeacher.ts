import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITeacherRepository } from '../domain/repositories/ITeacherRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetTeacherRequest {
  tenantId: string;
  teacherId: string;
}

export interface GetTeacherResponse {
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
  updatedAt: Date;
}

export class GetTeacher implements UseCase<GetTeacherRequest, GetTeacherResponse> {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(request: GetTeacherRequest): Promise<GetTeacherResponse> {
    const teacher = await this.teacherRepo.findById(request.tenantId, request.teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher', request.teacherId);
    }

    return {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      subjects: teacher.subjects,
      qualification: teacher.qualification,
      experience: teacher.experience,
      address: teacher.address,
      isActive: teacher.isActive,
      joiningDate: teacher.joiningDate,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };
  }
}
