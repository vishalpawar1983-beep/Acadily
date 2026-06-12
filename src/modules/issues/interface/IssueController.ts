import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateIssue } from '../application/CreateIssue.js';
import { ListIssues } from '../application/ListIssues.js';
import { GetIssue } from '../application/GetIssue.js';
import { UpdateIssue } from '../application/UpdateIssue.js';
import { DeleteIssue } from '../application/DeleteIssue.js';
import { UpdateIssueStatus } from '../application/UpdateIssueStatus.js';
import { ToggleDashboard } from '../application/ToggleDashboard.js';
import { ListDashboard } from '../application/ListDashboard.js';
import { GetDashboardByStudent } from '../application/GetDashboardByStudent.js';
import { MongoStudentIssueRepository } from '../infrastructure/MongoStudentIssueRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const issueRepo = new MongoStudentIssueRepository();

export class IssueController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateIssue(issueRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        date: req.body.date,
        particulars: req.body.particulars,
        addedBy: req.body.addedBy,
        showOnDashboard: req.body.showOnDashboard,
        status: req.body.status,
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

      const useCase = new ListIssues(issueRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string | undefined,
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

      const useCase = new ListIssues(issueRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string | undefined,
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

      const useCase = new GetIssue(issueRepo);
      const result = await useCase.execute({
        tenantId,
        issueId: req.params.id as string,
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

      const useCase = new UpdateIssue(issueRepo);
      const result = await useCase.execute({
        tenantId,
        issueId: req.params.id as string,
        particulars: req.body.particulars,
        date: req.body.date,
        showOnDashboard: req.body.showOnDashboard,
        status: req.body.status,
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

      const useCase = new DeleteIssue(issueRepo);
      const result = await useCase.execute({
        tenantId,
        issueId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateIssueStatus(issueRepo);
      const result = await useCase.execute({
        tenantId,
        issueId: req.params.id as string,
        showNotesDashBoard: req.body.showNotesDashBoard,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Dashboard ───────────────────────────────────────────

  async toggleDashboard(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ToggleDashboard(issueRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        showStudent: req.body.showStudent,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listDashboard(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListDashboard(issueRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardByStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetDashboardByStudent(issueRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
