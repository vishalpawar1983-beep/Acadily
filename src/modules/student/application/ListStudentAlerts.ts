import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentAlertRepository } from '../domain/repositories/IStudentAlertRepository.js';
import type { AlertStatus } from '../domain/entities/StudentAlert.js';

export interface ListStudentAlertsRequest {
  tenantId: string;
}

export interface ListStudentAlertsResponse {
  alerts: Array<{
    id: string;
    date: Date;
    reminderDateTime: Date;
    status: AlertStatus;
    particulars: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export class ListStudentAlerts
  implements UseCase<ListStudentAlertsRequest, ListStudentAlertsResponse>
{
  constructor(private readonly alertRepo: IStudentAlertRepository) {}

  async execute(request: ListStudentAlertsRequest): Promise<ListStudentAlertsResponse> {
    const alerts = await this.alertRepo.findAll(request.tenantId);

    return {
      alerts: alerts.map((a) => ({
        id: a.id,
        date: a.date,
        reminderDateTime: a.reminderDateTime,
        status: a.status,
        particulars: a.particulars,
        createdBy: a.createdBy,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    };
  }
}
