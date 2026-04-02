import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function verifyUserAuthorization(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('User not authorized', 403);
    }

    next();
  };
}
