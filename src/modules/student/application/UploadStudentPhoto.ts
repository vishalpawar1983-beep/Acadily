import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';

export interface UploadStudentPhotoRequest {
  tenantId: string;
  studentId: string;
  filePath: string;
}

export interface UploadStudentPhotoResponse {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  image: string;
  updatedAt: Date;
}

export class UploadStudentPhoto implements UseCase<UploadStudentPhotoRequest, UploadStudentPhotoResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: UploadStudentPhotoRequest): Promise<UploadStudentPhotoResponse> {
    if (!request.filePath) {
      throw new ValidationError('File path is required');
    }

    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    student.updateDetails({ image: request.filePath });

    const updated = await this.studentRepo.update(student);

    return {
      id: updated.id,
      rollNumber: updated.rollNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      image: updated.image!,
      updatedAt: updated.updatedAt,
    };
  }
}
