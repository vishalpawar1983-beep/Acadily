import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateAccount } from '../application/CreateAccount.js';
import { GetAccount } from '../application/GetAccount.js';
import { ListAccounts } from '../application/ListAccounts.js';
import { DeleteAccount } from '../application/DeleteAccount.js';
import { CreateEntry } from '../application/CreateEntry.js';
import { ListEntries } from '../application/ListEntries.js';
import { GetEntry } from '../application/GetEntry.js';
import { UpdateEntry } from '../application/UpdateEntry.js';
import { DeleteEntry } from '../application/DeleteEntry.js';
import { MongoDayBookRepository } from '../infrastructure/MongoDayBookRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const dayBookRepo = new MongoDayBookRepository();

export class DayBookController {
  // ── Accounts ──────────────────────────────────────────────

  async createAccount(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateAccount(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        accountName: req.body.accountName,
        accountId: req.body.accountId,
        accountType: req.body.accountType,
        isActive: req.body.isActive,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listAccounts(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListAccounts(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAccount(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetAccount(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        accountId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateAccount(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const account = await dayBookRepo.findAccountById(tenantId, req.params.id as string);
      if (!account) {
        return next(new ValidationError('Account not found'));
      }

      account.updateDetails({
        accountName: req.body.accountName,
        accountId: req.body.accountId,
        accountType: req.body.accountType,
        isActive: req.body.isActive,
      });

      const updated = await dayBookRepo.updateAccount(account);
      res.json({ success: true, data: { id: updated.id, accountName: updated.accountName, accountId: updated.accountId, accountType: updated.accountType, isActive: updated.isActive, updatedAt: updated.updatedAt } });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteAccount(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        accountId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Entries ───────────────────────────────────────────────

  async createEntry(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateEntry(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        accountId: req.body.accountId,
        accountName: req.body.accountName,
        accountType: req.body.accountType,
        companyId: req.body.companyId,
        date: req.body.date,
        narration: req.body.narration,
        debit: req.body.debit,
        credit: req.body.credit,
        balance: req.body.balance,
        studentId: req.body.studentId,
        studentName: req.body.studentName,
        rollNumber: req.body.rollNumber,
        receiptNumber: req.body.receiptNumber,
        linkAccountId: req.body.linkAccountId,
        linkAccountName: req.body.linkAccountName,
        linkAccountType: req.body.linkAccountType,
        linkDayBookAccountData: req.body.linkDayBookAccountData,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listEntries(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListEntries(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        accountId: req.query.accountId as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getEntry(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetEntry(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        entryId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateEntry(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateEntry(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        entryId: req.params.id as string,
        accountId: req.body.accountId,
        accountName: req.body.accountName,
        accountType: req.body.accountType,
        date: req.body.date,
        narration: req.body.narration,
        debit: req.body.debit,
        credit: req.body.credit,
        balance: req.body.balance,
        studentId: req.body.studentId,
        studentName: req.body.studentName,
        rollNumber: req.body.rollNumber,
        receiptNumber: req.body.receiptNumber,
        linkAccountId: req.body.linkAccountId,
        linkAccountName: req.body.linkAccountName,
        linkAccountType: req.body.linkAccountType,
        linkDayBookAccountData: req.body.linkDayBookAccountData,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteEntry(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteEntry(dayBookRepo);
      const result = await useCase.execute({
        tenantId,
        entryId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
