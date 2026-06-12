import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../types/RequestContext.js';
import { UserModel } from '../../../modules/auth/infrastructure/UserModel.js';
import { TrainerModel } from '../../../modules/trainers/infrastructure/TrainerModel.js';
import { logger } from '../logger/PinoLogger.js';

/**
 * Resolves the Trainer entity _id for authenticated Trainer-role users.
 *
 * Flow: req.user.userId → User.email → Trainer._id (by email match)
 * Attaches req.trainerEntityId so batch/attendance controllers can scope data.
 *
 * For non-Trainer roles this is a no-op (passes immediately).
 * If no matching Trainer entity is found the request still continues —
 * individual controllers will reject operations that need a resolved ID.
 */
export async function trainerContext(
  req: AppRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user || req.user.role !== 'Trainer') {
    return next();
  }

  const { userId, tenantId } = req.user;

  try {
    const userDoc = await UserModel.findOne({ _id: userId, tenantId })
      .select('email')
      .lean()
      .exec();

    if (!userDoc?.email) {
      return next();
    }

    const trainerDoc = await TrainerModel.findOne({ tenantId, email: userDoc.email })
      .select('_id')
      .lean()
      .exec();

    if (trainerDoc) {
      req.trainerEntityId = trainerDoc._id.toString();
    }
  } catch (err) {
    logger.error({ err, userId, tenantId }, 'trainerContext: failed to resolve trainer entity');
  }

  next();
}
