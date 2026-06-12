import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentAlertRepository } from '../domain/repositories/IStudentAlertRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AlertStatus } from '../domain/entities/StudentAlert.js';

export interface UpdateStudentAlertRequest {
  tenantId: string;
  alertId: string;
  date?: string;
  reminderDateTime?: string;
  status?: AlertStatus;
  particulars?: string;
}

export interface UpdateStudentAlertResponse {
  id: string;
  date: Date;
  reminderDateTime: Date;
  status: AlertStatus;
  particulars: string;
  updatedAt: Date;
}

export class UpdateStudentAlert
  implements UseCase<UpdateStudentAlertRequest, UpdateStudentAlertResponse>
{
  constructor(private readonly alertRepo: IStudentAlertRepository) {}

  async execute(request: UpdateStudentAlertRequest): Promise<UpdateStudentAlertResponse> {
    const alert = await this.alertRepo.findById(request.tenantId, request.alertId);
    if (!alert) {
      throw new NotFoundError('StudentAlert', request.alertId);
    }

    alert.updateDetails({
      date: request.date ? new Date(request.date) : undefined,
      reminderDateTime: request.reminderDateTime
        ? new Date(request.reminderDateTime)
        : undefined,
      status: request.status,
      particulars: request.particulars,
    });

    const updated = await this.alertRepo.update(alert);

    return {
      id: updated.id,
      date: updated.date,
      reminderDateTime: updated.reminderDateTime,
      status: updated.status,
      particulars: updated.particulars,
      updatedAt: updated.updatedAt,
    };
  }
}
