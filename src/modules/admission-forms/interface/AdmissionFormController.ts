import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { SubmitAdmissionForm } from '../application/SubmitAdmissionForm.js';
import { GetAdmissionForm } from '../application/GetAdmissionForm.js';
import { MongoAdmissionFormRepository } from '../infrastructure/MongoAdmissionFormRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoAdmissionFormRepository();

export class AdmissionFormController {
  async submit(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SubmitAdmissionForm(repo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        formData: req.body.formData,
        companyId: req.body.companyId,
        createdBy: req.user?.userId ?? '',
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getByStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetAdmissionForm(repo);
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
