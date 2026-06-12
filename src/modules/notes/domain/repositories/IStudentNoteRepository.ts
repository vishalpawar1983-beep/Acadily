import { StudentNote } from '../entities/StudentNote.js';

export interface FindAllNotesOptions {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface IStudentNoteRepository {
  findById(tenantId: string, id: string): Promise<StudentNote | null>;
  findByStudent(
    tenantId: string,
    studentId: string,
    options?: FindAllNotesOptions,
  ): Promise<{ notes: StudentNote[]; total: number }>;
  findAll(
    tenantId: string,
    options?: FindAllNotesOptions,
  ): Promise<{ notes: StudentNote[]; total: number }>;
  /**
   * Returns notes that have a reminder (startTime) active today.
   * A note is active if:
   *   - startTime is not null
   *   - endDate is null (one-time) OR endDate >= startOfDay(today)
   */
  findPendingReminders(tenantId: string, today: Date): Promise<StudentNote[]>;
  save(note: StudentNote): Promise<StudentNote>;
  update(note: StudentNote): Promise<StudentNote>;
  delete(tenantId: string, id: string): Promise<void>;
}
