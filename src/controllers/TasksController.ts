import { Request, Response } from 'express';
import z from 'zod';
import { prisma } from '../database/prisma';
import { AppError } from '../utils/AppError';

class TasksController {
  async index(req: Request, res: Response) {
    const querySchema = z.object({
      status: z.enum(['pending', 'in_progress', 'completed']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    });

    const { status, priority } = querySchema.parse(req.query);

    if (status) {
      const tasks = await prisma.tasks.findMany({
        where: { status },
      });
      return res.json({ tasks });
    }

    if (priority) {
      const tasks = await prisma.tasks.findMany({
        where: { priority },
      });
      return res.json({ tasks });
    }

    if (req.user!.role !== 'admin') {
      const tasks = await prisma.tasks.findMany({
        where: { assignedTo: req.user!.id },
      });
      return res.json({ tasks });
    }
    const tasks = await prisma.tasks.findMany();
    return res.json({ tasks });
  }

  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      title: z.string(),
      description: z.string().optional(),
      status: z.enum(['pending', 'in_progress', 'completed']),
      priority: z.enum(['low', 'medium', 'high']),
      assignedTo: z.number().int(),
      teamId: z.number().int(),
    });

    const { title, description, status, priority, assignedTo, teamId } =
      bodySchema.parse(req.body);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: assignedTo },
    });

    if (!user) {
      throw new AppError('User not found');
    }

    const task = await prisma.tasks.create({
      data: {
        title,
        description,
        status,
        priority,
        assignedTo,
        teamId,
      },
    });

    return res.json({
      data: task,
    });
  }

  async show(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.string().transform((value) => parseInt(value, 10)),
    });

    const { id } = paramsSchema.parse(req.params);

    const task = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return res.json({ task });
  }

  async update(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.string().transform((value) => parseInt(value, 10)),
    });

    const { id } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['pending', 'in_progress', 'completed']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assignedTo: z.number().int().optional(),
      teamId: z.number().int().optional(),
    });

    const { title, description, status, priority, assignedTo, teamId } =
      bodySchema.parse(req.body);

    const task = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (status) {
      await prisma.taskHistory.create({
        data: {
          taskId: id,
          changedBy: req.user!.id,
          oldStatus: task.status,
          newStatus: status,
        },
      });
    }

    const updatedTask = await prisma.tasks.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        assignedTo,
        teamId,
      },
    });

    return res.json({ task: updatedTask });
  }

  async delete(_req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.string().transform((value) => parseInt(value, 10)),
    });

    const { id } = paramsSchema.parse(_req.params);

    const task = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await prisma.tasks.delete({
      where: { id },
    });

    return res.json({ message: 'Task deleted successfully', task });
  }

  async history(req: Request, res: Response) {
    const paramsSchema = z.object({
      taskId: z.string().transform((value) => parseInt(value, 10)),
    });

    const { taskId } = paramsSchema.parse(req.params);

    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (req.user!.role !== 'admin' && task.assignedTo !== req.user!.id) {
      throw new AppError('User not authorized', 403);
    }

    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      orderBy: { changedAt: 'desc' },
    });

    return res.json({ taskId, history });
  }
}

export { TasksController };
