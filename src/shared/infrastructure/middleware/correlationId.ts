import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}
