import type { Request } from 'express';
import type { TenantContext } from './TenantContext.js';

export interface AuthUser {
  userId: string;
  role: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
}

export interface AppRequest extends Request {
  correlationId: string;
  tenantContext?: TenantContext;
  user?: AuthUser;
  /** Resolved Trainer entity _id for users with role 'Trainer'. Set by trainerContext middleware. */
  trainerEntityId?: string;
}
