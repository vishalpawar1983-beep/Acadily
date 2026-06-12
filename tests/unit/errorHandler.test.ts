import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../src/shared/infrastructure/middleware/errorHandler.js';

describe('AppError hierarchy', () => {
  it('should create NotFoundError with correct code and status', () => {
    const err = new NotFoundError('Student', '123');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Student with id 123 not found');
  });

  it('should create ValidationError with details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = new ValidationError('Invalid input', details);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual(details);
  });

  it('should create UnauthorizedError', () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
  });

  it('should create ForbiddenError', () => {
    const err = new ForbiddenError();
    expect(err.code).toBe('FORBIDDEN');
    expect(err.statusCode).toBe(403);
  });

  it('should create ConflictError', () => {
    const err = new ConflictError('Email already exists');
    expect(err.code).toBe('CONFLICT');
    expect(err.statusCode).toBe(409);
  });

  it('should be instanceof AppError', () => {
    const err = new NotFoundError('Student', '123');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});
