import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITeacherRepository } from '../domain/repositories/ITeacherRepository.js';

export interface ListTeachersRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface ListTeachersResponse {
  teachers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subjects: string[];
    qualification: string;
    experience: number;
    isActive: boolean;
    joiningDate: Date;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListTeachers implements UseCase<ListTeachersRequest, ListTeachersResponse> {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(request: ListTeachersRequest): Promise<ListTeachersResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { teachers, total } = await this.teacherRepo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
      search: request.search,
    });

    return {
      teachers: teachers.map((t) => ({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        subjects: t.subjects,
        qualification: t.qualification,
        experience: t.experience,
        isActive: t.isActive,
        joiningDate: t.joiningDate,
        createdAt: t.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
