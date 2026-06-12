import type { Request, Response, NextFunction } from 'express';
import { createRequestLogger, type RequestWithContext } from '../logger/PinoLogger.js';

// Re-export from domain for backward compatibility
export {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../domain/errors.js';

import { AppError } from '../../domain/errors.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const log = createRequestLogger(req as RequestWithContext);

  if (err instanceof AppError) {
    log.warn({ err, code: err.code }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  log.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
