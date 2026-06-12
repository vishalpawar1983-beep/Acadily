import type { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestsTotal,
  httpRequestsInFlight,
} from '../metrics/MetricsService.js';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip metrics endpoint itself to avoid recursion
  if (req.path === '/metrics') return next();

  httpRequestsInFlight.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    end(labels);
    httpRequestsTotal.inc(labels);
    httpRequestsInFlight.dec();
  });

  next();
}

function normalizeRoute(req: Request): string {
  // Use Express matched route if available, otherwise use path
  // This collapses /api/v1/students/abc123 into /api/v1/students/:id
  if (req.route?.path) {
    return req.baseUrl + req.route.path;
  }
  // Fallback: collapse ObjectId-like and UUID-like segments
  return req.path
    .replace(/\/[a-f0-9]{24}/g, '/:id')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:id');
}
