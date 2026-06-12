import type { Request, Response, NextFunction } from 'express';
import { createRequestLogger, type RequestWithContext } from '../logger/PinoLogger.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const log = createRequestLogger(req as RequestWithContext);

  log.info({ action: 'request.start' }, `${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logFn = res.statusCode >= 500
      ? log.error.bind(log)
      : res.statusCode >= 400
        ? log.warn.bind(log)
        : log.info.bind(log);

    logFn(
      { action: 'request.complete', httpStatus: res.statusCode, duration },
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}
