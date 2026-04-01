import { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import z from 'zod';
import { hash } from 'bcrypt';

class UsersController {
  public async index(_req: Request, res: Response) {
    const users = await prisma.user.findMany();
    return res.json({ message: 'UsersController index', data: users });
  }

  public async create(req: Request, res: Response) {
    const bodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['admin', 'member']).optional(),
    });
    const { name, email, password, role } = bodySchema.parse(req.body);

    // check if user already exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'member',
      },
    });

    const { password: passwordRemove, ...userWithoutPassword } = user;
    void passwordRemove; // to avoid unused variable error

    return res.status(201).json(userWithoutPassword);
  }

  public async update(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.coerce.number(),
    });

    const bodySchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(['admin', 'member']).optional(),
    });

    const { id } = paramsSchema.parse(req.params);
    const { name, email, role } = bodySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || user.name,
        email: email || user.email,
        role: role || user.role,
      },
    });

    const { password: passwordRemove, ...userWithoutPassword } = updatedUser;
    void passwordRemove; // to avoid unused variable error

    return res.status(200).json({
      message: 'User updated successfully',
      data: userWithoutPassword,
    });
  }

  public async delete(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.coerce.number(),
    });

    const { id } = paramsSchema.parse(req.params);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ message: 'User deleted successfully' });
  }
}

export { UsersController };
