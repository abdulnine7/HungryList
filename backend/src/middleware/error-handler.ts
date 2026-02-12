import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'The requested endpoint does not exist.',
  });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Please correct the highlighted input and try again.',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  logger.error({ err: error }, 'Unhandled error');
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong. Please try again.',
  });
};
