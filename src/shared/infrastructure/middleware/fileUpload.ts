import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ValidationError } from '../../domain/errors.js';
import { getUploadMiddleware, getRelativeFilePath } from '../upload/FileUploadService.js';
import { logger } from '../logger/PinoLogger.js';

/**
 * Wraps multer upload for a single file field.
 * Validates file type/size and converts multer errors to AppError responses.
 *
 * Usage in router:
 *   router.post('/upload', authGuard, ...uploadSingle('photo', 'students'), controller.handler)
 *
 * After this middleware, `req.file` is available and `req.uploadedFilePath` has the relative path.
 */
export function uploadSingle(fieldName: string, entityType: string = 'general') {
  const multerMiddleware = getUploadMiddleware(fieldName, entityType);

  const errorHandler = (req: Request, _res: Response, next: NextFunction) => {
    // Attach relative path to request for convenience
    if (req.file) {
      (req as any).uploadedFilePath = getRelativeFilePath(req.file);
      logger.info(
        { fieldName, filePath: (req as any).uploadedFilePath, size: req.file.size },
        'File uploaded successfully',
      );
    }
    next();
  };

  // Wrap multer middleware to catch its errors
  const safeMulterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const multerHandler = multerMiddleware[1] as any;

    // First run the entityType injector
    (multerMiddleware[0] as any)(req, res, (err: any) => {
      if (err) return next(err);

      // Then run multer with error handling
      multerHandler(req, res, (multerErr: any) => {
        if (multerErr) {
          if (multerErr instanceof multer.MulterError) {
            if (multerErr.code === 'LIMIT_FILE_SIZE') {
              return next(new ValidationError('File size exceeds the 5MB limit'));
            }
            if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
              return next(new ValidationError(`Unexpected file field. Expected: ${fieldName}`));
            }
            return next(new ValidationError(`Upload error: ${multerErr.message}`));
          }
          // File filter errors come as plain Error
          return next(new ValidationError(multerErr.message));
        }
        next();
      });
    });
  };

  return [safeMulterMiddleware, errorHandler];
}
