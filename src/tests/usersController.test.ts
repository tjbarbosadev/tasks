import request from 'supertest';
import { hash } from 'bcrypt';
import { User } from '../generated/prisma/client';
import { prisma } from '../database/prisma';
import { app } from '../app';

describe('UsersController', () => {
  let admin: User;
  let adminToken: string;
  let member: User;
  let memberToken: string;

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

    const adminAuth = await request(app).post('/sessions').send({
      email: admin.email,
      password: plainPassword,
    });
    adminToken = adminAuth.body.token;

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
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should return 200 and a list of users on GET /users', async () => {
    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('should create a user with 201 and without password in body', async () => {
    const email = `newuser.${Date.now()}@example.com`;
    const res = await request(app).post('/users').send({
      name: 'New User',
      email,
      password: plainPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'New User',
      email,
      role: 'member',
    });
    expect(res.body).not.toHaveProperty('password');

    await prisma.user.deleteMany({ where: { email } });
  });

  it('should return 409 when email already exists', async () => {
    const email = `dup.${Date.now()}@example.com`;
    await request(app).post('/users').send({
      name: 'First',
      email,
      password: plainPassword,
    });

    const res = await request(app).post('/users').send({
      name: 'Second',
      email,
      password: plainPassword,
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message', 'User already exists');

    await prisma.user.deleteMany({ where: { email } });
  });

  it('should return 400 on validation error when creating user', async () => {
    const res = await request(app).post('/users').send({
      name: 'Short Pass',
      email: 'invalid-email',
      password: '12345',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('should return 401 when updating user without token', async () => {
    const res = await request(app)
      .patch(`/users/${member.id}`)
      .send({ name: 'Hacker' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token is missing');
  });

  it('should return 403 when member tries to update a user', async () => {
    const res = await request(app)
      .patch(`/users/${member.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Should Fail' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'User not authorized');
  });

  it('should return 200 when admin updates a user', async () => {
    const res = await request(app)
      .patch(`/users/${member.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Member Name' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'User updated successfully',
    });
    expect(res.body.data).toMatchObject({
      id: member.id,
      name: 'Updated Member Name',
    });
  });

  it('should return 404 when updating non-existent user', async () => {
    const res = await request(app)
      .patch('/users/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nobody' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'User not found');
  });

  it('should return 401 when deleting user without token', async () => {
    const res = await request(app).delete(`/users/${member.id}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token is missing');
  });

  it('should return 403 when member tries to delete a user', async () => {
    const res = await request(app)
      .delete(`/users/${member.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'User not authorized');
  });

  it('should return 200 when admin deletes a user', async () => {
    const hashedPassword = await hash(plainPassword, 10);
    const toDelete = await prisma.user.create({
      data: {
        name: 'To Delete',
        email: `todelete.${Date.now()}@example.com`,
        password: hashedPassword,
        role: 'member',
      },
    });

    const res = await request(app)
      .delete(`/users/${toDelete.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });

  it('should return 404 when deleting non-existent user', async () => {
    const res = await request(app)
      .delete('/users/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'User not found');
  });
});
