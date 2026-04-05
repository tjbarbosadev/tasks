import { hash } from 'bcrypt';
import { User } from '../generated/prisma/browser';
import { app } from '../app';
import request from 'supertest';
import { prisma } from '../database/prisma';

describe('TasksController', () => {
  let admin: User; // Simulates an admin user
  let adminToken: string; // Stores the token for the admin user
  let member: User; // Simulates a regular member user
  let memberToken: string; // Stores the token for the member user
  let teamId: number; // Stores the ID of a team created during tests
  let taskId: number; // Stores the ID of a task created during tests

  const plainPassword = 'password123';

  beforeAll(async () => {
    const hashedPassword = await hash(plainPassword, 10);

    admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: `admin.${Date.now()}@example.com`,
        password: hashedPassword,
        role: 'admin',
      },
    });

    member = await prisma.user.create({
      data: {
        name: 'Member User',
        email: `member.${Date.now()}@example.com`,
        password: hashedPassword,
        role: 'member',
      },
    });

    // Authenticate admin user to get token
    const adminAuth = await request(app).post('/sessions').send({
      email: admin.email,
      password: plainPassword,
    });
    adminToken = adminAuth.body.token;

    // Authenticate member user to get token
    const memberAuth = await request(app).post('/sessions').send({
      email: member.email,
      password: plainPassword,
    });
    memberToken = memberAuth.body.token;
  });

  afterAll(async () => {
    try {
      // Teams cascade-delete tasks, task history, and team_members
      await prisma.team.deleteMany({
        where: {
          name: {
            in: ['Test Team for Listing Tasks', 'Test Team for Tasks'],
          },
        },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [admin.id, member.id] } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should list tasks based on user role', async () => {
    // First, create a team to associate the task with
    const teamRes = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Team for Listing Tasks',
        description: 'A team for testing task listing',
      });

    expect(teamRes.status).toBe(201);
    teamId = teamRes.body.id;

    // Create a task assigned to the member user
    const taskRes = await request(app)
      .post(`/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Task for Listing',
        description: 'A task created for listing tests',
        status: 'pending',
        priority: 'medium',
        assignedTo: member.id,
        teamId,
      });

    expect(taskRes.status).toBe(201);
    taskId = taskRes.body.task.id;

    // Test listing tasks as admin (should see all tasks)
    const adminListRes = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminListRes.status).toBe(200);
    expect(adminListRes.body).toHaveProperty('tasks');
    expect(Array.isArray(adminListRes.body.tasks)).toBe(true);
    expect(adminListRes.body.tasks.length).toBeGreaterThan(0);

    // Test listing tasks as member (should only see assigned tasks)
    const memberListRes = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(memberListRes.status).toBe(200);
    expect(memberListRes.body).toHaveProperty('tasks');
    expect(Array.isArray(memberListRes.body.tasks)).toBe(true);
    expect(memberListRes.body.tasks.length).toBeGreaterThan(0);
    expect(memberListRes.body.tasks[0].assignedTo).toBe(member.id);
  });

  it('should create a new task', async () => {
    // First, create a team to associate the task with
    const teamRes = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Team for Tasks',
        description: 'A team for testing tasks',
      });

    expect(teamRes.status).toBe(201);
    teamId = teamRes.body.id;

    // Now, create a task for that team
    const taskRes = await request(app)
      .post(`/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Task',
        description: 'A task created during testing',
        status: 'pending',
        priority: 'medium',
        assignedTo: member.id,
        teamId,
      });

    taskId = taskRes.body.task.id; // Store the created task ID for cleanup

    expect(taskRes.body).toHaveProperty('task');
    expect(taskRes.body.task).toHaveProperty('id');
    expect(taskRes.body.task.title).toBe('Test Task');
  });

  it('should not allow member to create a task', async () => {
    const taskRes = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Unauthorized Task',
        description: 'This should not be created',
        status: 'pending',
      });

    expect(taskRes.status).toBe(403);
    expect(taskRes.body).toHaveProperty('message', 'User not authorized');
  });

  it('should show task details', async () => {
    const taskRes = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(taskRes.status).toBe(200);
    expect(taskRes.body).toHaveProperty('task');
    expect(taskRes.body.task).toHaveProperty('id', taskId);
    expect(taskRes.body.task).toHaveProperty('title', 'Test Task');
  });
});
