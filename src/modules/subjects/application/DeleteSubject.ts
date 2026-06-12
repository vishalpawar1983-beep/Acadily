import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ISubjectRepository } from '../domain/repositories/ISubjectRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteSubjectRequest {
  tenantId: string;
  subjectId: string;
}

export interface DeleteSubjectResponse {
  id: string;
  deleted: boolean;
}

export class DeleteSubject implements UseCase<DeleteSubjectRequest, DeleteSubjectResponse> {
  constructor(private readonly subjectRepo: ISubjectRepository) {}

  async execute(request: DeleteSubjectRequest): Promise<DeleteSubjectResponse> {
    const subject = await this.subjectRepo.findById(request.tenantId, request.subjectId);
    if (!subject) {
      throw new NotFoundError('Subject', request.subjectId);
    }

    await this.subjectRepo.delete(request.tenantId, request.subjectId);

    return {
      id: request.subjectId,
      deleted: true,
    };
  }
}
