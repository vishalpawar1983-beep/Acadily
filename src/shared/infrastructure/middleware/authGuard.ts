import type { Response, NextFunction } from "express";
import type { AppRequest } from "../../types/RequestContext.js";
import { JwtTokenService } from "../../../modules/auth/infrastructure/JwtTokenService.js";
import { UnauthorizedError, ForbiddenError } from "../../domain/errors.js";
import type { RoleType } from "../../../modules/auth/domain/value-objects/Role.js";

const tokenService = new JwtTokenService();

export function authGuard(
  req: AppRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError("Missing or invalid Authorization header"),
    );
  }

  const token = authHeader.slice(7);
  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role as RoleType,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };

    // Ensure JWT tenantId matches resolved tenant
    if (req.tenantContext && req.tenantContext.tenantId !== payload.tenantId) {
      return next(new ForbiddenError("Token tenant mismatch"));
    }
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

export function requireRole(...roles: RoleType[]) {
  return (req: AppRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    if (!roles.includes(req.user.role as RoleType)) {
      return next(new ForbiddenError(`Requires one of: ${roles.join(", ")}`));
    }
    next();
  };
}
