import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseRepository } from '../domain/repositories/ICourseRepository.js';
import { Course, type SubjectProps } from '../domain/entities/Course.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateCourseRequest {
  tenantId: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects?: SubjectProps[];
  createdBy: string;
}

export interface CreateCourseResponse {
  id: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects: SubjectProps[];
  isActive: boolean;
}

export class CreateCourse implements UseCase<CreateCourseRequest, CreateCourseResponse> {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(request: CreateCourseRequest): Promise<CreateCourseResponse> {
    const existing = await this.courseRepo.findAll(request.tenantId, { limit: 1 });
    const duplicate = existing.courses.find(
      (c) => c.name.toLowerCase() === request.name.toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictError('Course with this name already exists');
    }

    const course = Course.create({
      tenantId: request.tenantId,
      name: request.name,
      fees: request.fees,
      courseType: request.courseType,
      durationYears: request.durationYears,
      category: request.category,
      subjects: request.subjects,
      createdBy: request.createdBy,
    });

    const saved = await this.courseRepo.save(course);

    return {
      id: saved.id,
      name: saved.name,
      fees: saved.fees,
      courseType: saved.courseType,
      durationYears: saved.durationYears,
      category: saved.category,
      subjects: saved.subjects,
      isActive: saved.isActive,
    };
  }
}
