import type { Response, NextFunction } from "express";
import type { AppRequest } from "../../../shared/types/RequestContext.js";
import { GetNextReceiptNumber } from "../application/GetNextReceiptNumber.js";
import { GetReceiptCounter } from "../application/GetReceiptCounter.js";
import { UpdateReceiptCounter } from "../application/UpdateReceiptCounter.js";
import { MongoReceiptCounterRepository } from "../infrastructure/MongoReceiptCounterRepository.js";
import { MongoTenantRepository } from "../../tenant/infrastructure/MongoTenantRepository.js";
import { ValidationError } from "../../../shared/domain/errors.js";

const counterRepo = new MongoReceiptCounterRepository();
const tenantRepo = new MongoTenantRepository();

export class ReceiptController {
  async getNext(
    req: AppRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId)
        return next(new ValidationError("Tenant context required"));

      const useCase = new GetNextReceiptNumber(counterRepo, tenantRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId)
        return next(new ValidationError("Tenant context required"));

      const useCase = new GetReceiptCounter(counterRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: AppRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId)
        return next(new ValidationError("Tenant context required"));

      const useCase = new UpdateReceiptCounter(counterRepo);
      const result = await useCase.execute({
        tenantId,
        prefix: req.body.prefix,
        currentValue: req.body.currentValue,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
