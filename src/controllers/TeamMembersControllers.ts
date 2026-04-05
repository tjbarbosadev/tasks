import { Request, Response } from 'express';
import z from 'zod';
import { AppError } from '../utils/AppError';
import { prisma } from '../database/prisma';

class TeamMembersController {
  async index(req: Request, res: Response) {
    const paramsSchema = z.object({
      teamId: z.coerce.number(),
    });

    const { teamId } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json({ ...team, members: teamMembers });
  }

  async create(req: Request, res: Response) {
    const paramsSchema = z.object({
      teamId: z.coerce.number(),
      memberId: z.coerce.number(),
    });

    const { teamId, memberId } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const existingTeamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberId,
      },
    });

    if (existingTeamMember) {
      throw new AppError('User is already a team member', 409);
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: memberId,
      },
    });

    return res.status(201).json(teamMember);
  }

  async delete(req: Request, res: Response) {
    const paramsSchema = z.object({
      teamId: z.coerce.number(),
      memberId: z.coerce.number(),
    });

    const { teamId, memberId } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const deletedMember = await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId: memberId,
      },
    });

    if (deletedMember.count === 0) {
      throw new AppError('Team member not found', 404);
    }

    return res.status(204).json({
      message: `Membro removido - time: ${team.name}, membro: ${user.name}`,
    });
  }
}

export { TeamMembersController };
