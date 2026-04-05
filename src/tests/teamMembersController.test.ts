import request from 'supertest';
import { hash } from 'bcrypt';
import { User } from '../generated/prisma/client';
import { prisma } from '../database/prisma';
import { app } from '../app';

describe('TeamMembersController', () => {
  let admin: User; // Simulates an admin user
  let adminToken: string; // Stores the token for the admin user
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

    // Authenticate admin user to get token
    const adminAuth = await request(app).post('/sessions').send({
      email: admin.email,
      password: plainPassword,
    });
    adminToken = adminAuth.body.token;
  });

  afterAll(async () => {
    try {
      await prisma.user.delete({ where: { id: admin.id } });

      await prisma.team.deleteMany({
        where: { id: teamId },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should list team members', async () => {
    // First, create a team to work with
    const teamRes = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Team',
        description: 'A team for testing',
      });

    expect(teamRes.status).toBe(201);
    teamId = teamRes.body.id;

    // Now, list the team members (should be empty at this point)
    const listRes = await request(app)
      .get(`/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveProperty('members');
    expect(Array.isArray(listRes.body.members)).toBe(true);
    expect(listRes.body.members.length).toBe(0);
  });

  it('should add a member to a team', async () => {
    // First, create a team to work with
    const teamRes = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Team',
        description: 'A team for testing',
      });

    expect(teamRes.status).toBe(201);
    teamId = teamRes.body.id;

    // Create a new user to add as a member
    const memberRes = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Member User',
        email: `member.${Date.now()}@example.com`,
        password: plainPassword,
        role: 'member',
      });

    expect(memberRes.status).toBe(201);
    const memberId = memberRes.body.id;

    // Now, add the member to the team
    const addMemberRes = await request(app)
      .post(`/teams/${teamId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(addMemberRes.status).toBe(201);
    expect(addMemberRes.body).toMatchObject({
      teamId,
      userId: memberId,
    });
  });

  it('should remove a member from a team', async () => {
    // Create a new user to add and then remove as a member
    const memberRes = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Member User',
        email: `member.${Date.now()}@example.com`,
        password: plainPassword,
        role: 'member',
      });

    expect(memberRes.status).toBe(201);
    const memberId = memberRes.body.id;

    // Add the member to the team first
    await request(app)
      .post(`/teams/${teamId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Now, remove the member from the team
    const removeMemberRes = await request(app)
      .delete(`/teams/${teamId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(removeMemberRes.status).toBe(204);
  });
});
