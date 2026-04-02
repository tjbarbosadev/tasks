import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verify } from 'jsonwebtoken';
import { authConfig } from '../configs/auth';

interface TokenPayload {
  sub: string;
  role: 'admin' | 'member';
}

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  const { sub: user_id, role } = verify(
    token,
    authConfig.jwt.secret,
  ) as TokenPayload;

  req.user = {
    id: Number(user_id),
    role,
  };

  next();
}
