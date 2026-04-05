import z from 'zod';
import { prisma } from '../database/prisma';
import { AppError } from '../utils/AppError';
import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { authConfig } from '../configs/auth';

class SessionsController {
  async create(req: Request, res: Response) {
    // getUserByEmail
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const { email, password } = bodySchema.parse(req.body);

    // check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const hashPassword = await compare(password, user.password);

    if (!hashPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({ role: user.role }, secret, {
      subject: String(user.id),
      expiresIn: expiresIn,
    });

    return res.status(201).json({ token });
  }
}

export { SessionsController };
