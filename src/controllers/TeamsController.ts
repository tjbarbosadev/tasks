import { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import z from 'zod';
import { AppError } from '../utils/AppError';

class TeamsController {
  async index(_req: Request, res: Response) {
    const teams = await prisma.team.findMany();
    return res.json({ teams });
  }

  async create(_req: Request, res: Response) {
    const bodySchema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
    });

    const { name, description } = bodySchema.parse(_req.body);

    const teams = await prisma.team.create({
      data: {
        name,
        description,
      },
    });

    if (!teams) {
      throw new AppError('Failed to create team', 500);
    }

    return res.status(201).json(teams);
  }

  async show(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.coerce.number(),
    });

    const { id } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return res.json(team);
  }

  async update(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.coerce.number(),
    });
    const { id } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
    });

    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const { name, description } = bodySchema.parse(req.body);

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    if (!updatedTeam) {
      throw new AppError('Failed to update team', 500);
    }

    return res.json(updatedTeam);
  }

  async delete(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.coerce.number(),
    });

    const { id } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await prisma.team.delete({ where: { id } });

    return res.json({ message: 'Team deleted successfully' });
  }
}

export { TeamsController };
