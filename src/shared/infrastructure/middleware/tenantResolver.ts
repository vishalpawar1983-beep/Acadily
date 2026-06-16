import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../types/RequestContext.js';
import { TenantModel } from '../../../modules/tenant/infrastructure/TenantModel.js';
import { JwtTokenService } from '../../../modules/auth/infrastructure/JwtTokenService.js';
import { logger } from '../logger/PinoLogger.js';

const tokenService = new JwtTokenService();

const PUBLIC_ROUTES = [
  '/health', '/ready', '/metrics',
  // Public enquiry form (no login) — tenant is derived from the company/form id
  '/public/',
  // Legacy auth routes (via legacy gateway, req.path is relative to /api mount)
  '/users/auth', '/register', '/users/requestPassword', '/users/verifyToken',
  '/users/verify-otp', '/users/resend-otp',
  // New auth routes
  '/v1/auth/login', '/v1/auth/register', '/v1/auth/verify-otp', '/v1/users/request-password-reset', '/v1/users/reset-password',
];

export async function tenantResolverMiddleware(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
  // Skip tenant resolution for public routes
  if (PUBLIC_ROUTES.some((route) => req.path.startsWith(route))) {
    next();
    return;
  }

  // Priority 1: From authenticated user's JWT (set by authGuard)
  if (req.user?.tenantId) {
    req.tenantContext = { tenantId: req.user.tenantId };
    next();
    return;
  }

  // Priority 2: X-Tenant-Id header
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId) {
    req.tenantContext = { tenantId: headerTenantId };
    next();
    return;
  }

  // Priority 3: Extract tenantId from Bearer JWT (for legacy frontends that don't send X-Tenant-Id)
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const hasTokenString = bearerToken && bearerToken !== 'undefined' && bearerToken.length > 10;
  let tokenVerified = false;

  if (hasTokenString) {
    try {
      const payload = tokenService.verifyAccessToken(bearerToken);
      if (payload.tenantId) {
        req.tenantContext = { tenantId: payload.tenantId };
        req.user = { userId: payload.userId, tenantId: payload.tenantId, role: payload.role as any };
        tokenVerified = true;
        next();
        return;
      }
    } catch {
      // Token invalid/expired — fall through
    }
  }

  // Priority 4: Subdomain extraction — look up by slug using TenantModel
  const host = req.headers['x-tenant-host'] as string || req.hostname;
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    try {
      const tenant = await TenantModel.findOne({ slug: subdomain, isActive: true }).select('tenantId').lean().exec();
      if (tenant) {
        req.tenantContext = { tenantId: tenant.tenantId };
        next();
        return;
      }
      logger.warn({ subdomain, host }, 'No active tenant found for subdomain');
    } catch (err) {
      logger.error({ subdomain, err }, 'Error looking up tenant by subdomain');
    }
  }

  // If there was a token but it was invalid/expired, return 401 so the frontend
  // knows to trigger a token refresh. Silently returning empty data causes the
  // "no data on first load" bug — the frontend never refreshes the token.
  if (!tokenVerified && hasTokenString) {
    logger.debug({ path: req.path }, 'Expired/invalid token — returning 401');
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' },
    });
    return;
  }

  // No token at all (login page, public pages) — assign sentinel so GET requests
  // pass through and return the correct empty shape without error floods.
  if (!tokenVerified && req.method === 'GET') {
    logger.debug({ path: req.path }, 'Unauthenticated GET — using empty tenant scope');
    req.tenantContext = { tenantId: '__unauthenticated__' };
    next();
    return;
  }

  logger.warn({ path: req.path, host }, 'Tenant could not be resolved');
  res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  });
}

function extractSubdomain(host: string): string | null {
  // Handle formats like "chanakya.flexacademy.in" or "chanakya.localhost"
  const parts = host.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'api') {
    return parts[0];
  }
  return null;
}
