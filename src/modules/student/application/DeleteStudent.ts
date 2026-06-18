import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { FeeModel } from '../../fees/infrastructure/FeeModel.js';
import { FeeInstallmentModel } from '../../installments/infrastructure/FeeInstallmentModel.js';
import { StudentMarksModel } from '../../marks/infrastructure/StudentMarksModel.js';
import { StudentIssueModel } from '../../issues/infrastructure/StudentIssueModel.js';

export interface DeleteStudentRequest {
  tenantId: string;
  studentId: string;
}

export interface DeleteStudentResponse {
  id: string;
  deleted: boolean;
}

export class DeleteStudent implements UseCase<DeleteStudentRequest, DeleteStudentResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: DeleteStudentRequest): Promise<DeleteStudentResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    // Cascade delete related records
    await Promise.all([
      FeeModel.deleteMany({ tenantId: request.tenantId, studentId: request.studentId }).exec(),
      FeeInstallmentModel.deleteMany({ tenantId: request.tenantId, studentId: request.studentId }).exec(),
      StudentMarksModel.deleteMany({ tenantId: request.tenantId, studentId: request.studentId }).exec(),
      StudentIssueModel.deleteMany({ tenantId: request.tenantId, studentId: request.studentId }).exec(),
    ]);

    await this.studentRepo.delete(request.tenantId, request.studentId);

    return {
      id: request.studentId,
      deleted: true,
    };
  }
}
