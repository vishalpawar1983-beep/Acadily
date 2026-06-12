import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentAlertRepository } from '../domain/repositories/IStudentAlertRepository.js';
import { StudentAlert } from '../domain/entities/StudentAlert.js';
import type { AlertStatus } from '../domain/entities/StudentAlert.js';

export interface CreateStudentAlertRequest {
  tenantId: string;
  studentId?: string;
  date: string;
  reminderDateTime: string;
  status?: AlertStatus;
  particulars: string;
  createdBy: string;
}

export interface CreateStudentAlertResponse {
  id: string;
  date: Date;
  reminderDateTime: Date;
  status: AlertStatus;
  particulars: string;
  createdAt: Date;
}

export class CreateStudentAlert
  implements UseCase<CreateStudentAlertRequest, CreateStudentAlertResponse>
{
  constructor(private readonly alertRepo: IStudentAlertRepository) {}

  async execute(request: CreateStudentAlertRequest): Promise<CreateStudentAlertResponse> {
    const alert = StudentAlert.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      date: new Date(request.date),
      reminderDateTime: new Date(request.reminderDateTime),
      status: request.status,
      particulars: request.particulars,
      createdBy: request.createdBy,
    });

    const saved = await this.alertRepo.save(alert);

    return {
      id: saved.id,
      date: saved.date,
      reminderDateTime: saved.reminderDateTime,
      status: saved.status,
      particulars: saved.particulars,
      createdAt: saved.createdAt,
    };
  }
}
