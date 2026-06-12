import pino from 'pino';
import type { Request } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.secret',
      '*.token',
      'MONGO_URI',
    ],
    censor: '[REDACTED]',
  },
  transport: !isProduction && !isStaging
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export interface RequestWithContext extends Request {
  correlationId?: string;
  tenantContext?: { tenantId: string };
  user?: { id: string; role: string; tenantId: string };
}

export function createRequestLogger(req: RequestWithContext) {
  return logger.child({
    correlationId: req.correlationId,
    tenantId: req.tenantContext?.tenantId,
    userId: req.user?.id,
    httpMethod: req.method,
    httpPath: req.path,
  });
}
