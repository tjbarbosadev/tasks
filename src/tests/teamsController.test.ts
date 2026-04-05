import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';
import { User } from '../generated/prisma/client';
import { hash } from 'bcrypt';

describe('TeamsController', () => {
  let admin: User; // Simulates an admin user
  let adminToken: string; // Stores the token for the admin user
  let member: User; // Simulates a regular member user
  let memberToken: string; // Stores the token for the member user
  let teamId: number; // Stores the ID of a team created during tests

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
      await prisma.user.deleteMany({
        where: { id: { in: [admin.id, member.id] } },
      });

      await prisma.team.deleteMany({
        where: { id: teamId },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app).get('/teams');
    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not an admin', async () => {
    const response = await request(app)
      .get('/teams')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it('should return 200 and a list of teams for admin users', async () => {
    const response = await request(app)
      .get('/teams')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.teams)).toBe(true);
  });

  it('should create a valid team with admin user', async () => {
    const response = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Team' });

    teamId = response.body.id;

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'New Team',
    });
  });

  it('should return a invalid body with zod name validation error', async () => {
    const response = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'a' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message[0].code).toContain('too_small');
  });

  it('should return a id with a valid team creation', async () => {
    const response = await request(app)
      .get('/teams/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'QA' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it('should return 404 if team does not exist', async () => {
    const response = await request(app)
      .get('/teams/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it('should return 200 after updating a team', async () => {
    const response = await request(app)
      .patch(`/teams/${teamId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Team' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: teamId,
      name: 'Updated Team',
    });
  });

  it('should return 404 when trying to update a non-existent team', async () => {
    const response = await request(app)
      .patch('/teams/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Non-existent Team' });

    expect(response.status).toBe(404);
  });

  it('should return 204 after deleting a team', async () => {
    const response = await request(app)
      .delete(`/teams/${teamId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 when trying to delete a non-existent team', async () => {
    const response = await request(app)
      .delete('/teams/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
