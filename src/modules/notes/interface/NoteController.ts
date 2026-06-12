import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateNote } from '../application/CreateNote.js';
import { ListNotes } from '../application/ListNotes.js';
import { GetNote } from '../application/GetNote.js';
import { UpdateNote } from '../application/UpdateNote.js';
import { DeleteNote } from '../application/DeleteNote.js';
import { GetPendingReminders } from '../application/GetPendingReminders.js';
import { MongoStudentNoteRepository } from '../infrastructure/MongoStudentNoteRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const noteRepo = new MongoStudentNoteRepository();

export class NoteController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateNote(noteRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        date: req.body.date,
        particulars: req.body.particulars,
        // Fall back to the logged-in user's full name when the legacy frontend omits addedBy
        addedBy: req.body.addedBy ||
          [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') ||
          req.user?.userId || '',
        startTime: req.body.startTime,
        endDate: req.body.endDate,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListNotes(noteRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getByStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListNotes(noteRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetNote(noteRepo);
      const result = await useCase.execute({
        tenantId,
        noteId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateNote(noteRepo);
      const result = await useCase.execute({
        tenantId,
        noteId: req.params.id as string,
        particulars: req.body.particulars,
        date: req.body.date,
        startTime: req.body.startTime,
        endDate: req.body.endDate,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteNote(noteRepo);
      const result = await useCase.execute({
        tenantId,
        noteId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPendingReminders(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetPendingReminders(noteRepo);
      const reminders = await useCase.execute({ tenantId });
      res.json({ success: true, data: reminders });
    } catch (err) {
      next(err);
    }
  }
}
