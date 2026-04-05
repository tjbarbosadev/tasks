import request from 'supertest';
import { hash } from 'bcrypt';
import { prisma } from '../database/prisma';
import { app } from '../app';

describe('SessionsController', () => {
  let userId: number;
  const plainPassword = 'password123';
  const userEmail = `john.${Date.now()}@example.com`;

  beforeAll(async () => {
    const hashedPassword = await hash(plainPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: userEmail,
        password: hashedPassword,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    try {
      await prisma.user.delete({ where: { id: userId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should return 200 and a token with valid credentials', async () => {
    const res = await request(app).post('/sessions').send({
      email: userEmail,
      password: plainPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('should return 401 with wrong password', async () => {
    const res = await request(app).post('/sessions').send({
      email: userEmail,
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('should return 401 when user does not exist', async () => {
    const res = await request(app).post('/sessions').send({
      email: 'nobody@example.com',
      password: plainPassword,
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });
});
