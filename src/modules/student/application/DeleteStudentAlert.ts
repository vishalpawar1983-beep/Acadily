import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentAlertRepository } from '../domain/repositories/IStudentAlertRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteStudentAlertRequest {
  tenantId: string;
  alertId: string;
}

export interface DeleteStudentAlertResponse {
  id: string;
  deleted: boolean;
}

export class DeleteStudentAlert
  implements UseCase<DeleteStudentAlertRequest, DeleteStudentAlertResponse>
{
  constructor(private readonly alertRepo: IStudentAlertRepository) {}

  async execute(request: DeleteStudentAlertRequest): Promise<DeleteStudentAlertResponse> {
    const alert = await this.alertRepo.findById(request.tenantId, request.alertId);
    if (!alert) {
      throw new NotFoundError('StudentAlert', request.alertId);
    }

    await this.alertRepo.delete(request.tenantId, request.alertId);

    return {
      id: request.alertId,
      deleted: true,
    };
  }
}
