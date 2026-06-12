import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateForm } from '../application/CreateForm.js';
import { ListForms } from '../application/ListForms.js';
import { GetForm } from '../application/GetForm.js';
import { UpdateForm } from '../application/UpdateForm.js';
import { DeleteForm } from '../application/DeleteForm.js';
import { SubmitForm } from '../application/SubmitForm.js';
import { PublicSubmitForm } from '../application/PublicSubmitForm.js';
import { ListSubmissions } from '../application/ListSubmissions.js';
import { GetSubmission } from '../application/GetSubmission.js';
import { UpdateSubmission } from '../application/UpdateSubmission.js';
import { DeleteSubmission } from '../application/DeleteSubmission.js';
import { CreateSelect } from '../application/CreateSelect.js';
import { ListSelects } from '../application/ListSelects.js';
import { GetSelect } from '../application/GetSelect.js';
import { UpdateSelect } from '../application/UpdateSelect.js';
import { MongoCustomFormRepository } from '../infrastructure/MongoCustomFormRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoCustomFormRepository();

export class CustomFormController {
  async createForm(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateForm(repo);
      const result = await useCase.execute({
        tenantId,
        formName: req.body.formName,
        fields: req.body.fields,
        isActive: req.body.isActive,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listForms(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListForms(repo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getForm(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetForm(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateForm(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateForm(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.id as string,
        formName: req.body.formName,
        fields: req.body.fields,
        isActive: req.body.isActive,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async submitForm(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SubmitForm(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.formId as string,
        values: req.body.values,
        addedBy: req.user?.userId ?? 'unknown',
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listSubmissions(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListSubmissions(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.formId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteForm(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteForm(repo);
      await useCase.execute({
        tenantId,
        formId: req.params.id as string,
      });
      res.json({ success: true, data: { message: 'Form deleted' } });
    } catch (err) {
      next(err);
    }
  }

  async publicSubmitForm(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new PublicSubmitForm(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.formId as string,
        values: req.body.values,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSubmission(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetSubmission(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.formId as string,
        submissionId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateSubmission(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateSubmission(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.params.formId as string,
        submissionId: req.params.id as string,
        values: req.body.values,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteSubmission(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteSubmission(repo);
      await useCase.execute({
        tenantId,
        formId: req.params.formId as string,
        submissionId: req.params.id as string,
      });
      res.json({ success: true, data: { message: 'Submission deleted' } });
    } catch (err) {
      next(err);
    }
  }

  // ── Default Selects ─────────────────────────────────────────

  async createSelect(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateSelect(repo);
      const result = await useCase.execute({
        tenantId,
        selectName: req.body.selectName,
        options: req.body.options,
        mandatory: req.body.mandatory,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listSelects(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListSelects(repo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSelect(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetSelect(repo);
      const result = await useCase.execute({
        tenantId,
        selectId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateSelect(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateSelect(repo);
      const result = await useCase.execute({
        tenantId,
        selectId: req.params.id as string,
        selectName: req.body.selectName,
        options: req.body.options,
        mandatory: req.body.mandatory,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
