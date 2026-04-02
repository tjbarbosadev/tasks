import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export function errorHandling(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'app error',
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 'validation error',
      message: error.issues,
    });
  }

  return res.status(500).json({
    status: 'internal server error',
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  });
}
