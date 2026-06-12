import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentNoteRepository } from '../domain/repositories/IStudentNoteRepository.js';

export interface GetPendingRemindersRequest {
  tenantId: string;
}

export interface ReminderItem {
  id: string;
  studentId: string;
  particulars: string;
  startTime: Date;
  endDate: Date | null;
  addedBy: string;
}

export class GetPendingReminders
  implements UseCase<GetPendingRemindersRequest, ReminderItem[]>
{
  constructor(private readonly repo: IStudentNoteRepository) {}

  async execute(request: GetPendingRemindersRequest): Promise<ReminderItem[]> {
    const notes = await this.repo.findPendingReminders(request.tenantId, new Date());

    return notes
      .filter((n) => n.startTime !== null)
      .map((n) => ({
        id: n.id,
        studentId: n.studentId,
        particulars: n.particulars,
        startTime: n.startTime as Date,
        endDate: n.endDate,
        addedBy: n.addedBy,
      }));
  }
}
