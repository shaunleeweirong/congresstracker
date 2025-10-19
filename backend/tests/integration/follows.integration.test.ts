import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

let app: Express;
let authToken: string;
let testUserId: string;
let testPoliticianId: string;

describe('Follows Integration Tests', () => {
  beforeAll(async () => {
    await db.testConnection();
    
    const testUser = {
      email: 'follows-test@example.com',
      password: 'FollowsTest123!',
      name: 'Follows Test User'
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    authToken = registerResponse.body.token;
    testUserId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await db.close();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  describe('Follow Management Workflow', () => {
    it('should follow and unfollow politicians with billing implications', async () => {
      // Create test politician
      const politician = await db.insert('congressional_members', {
        id: uuidv4(),
        name: 'Follow Test Representative',
        position: 'representative',
        state_code: 'WA',
        district: 7,
        party_affiliation: 'democratic',
        office_start_date: '2022-01-03'
      });
      testPoliticianId = politician.id;

      // Follow politician
      const followResponse = await request(app)
        .post('/api/v1/follows')
        .set(authHeaders())
        .send({
          traderType: 'congressional',
          traderId: testPoliticianId
        })
        .expect(201);

      expect(followResponse.body).toMatchObject({
        id: expect.any(String),
        traderType: 'congressional',
        traderId: testPoliticianId,
        billingStatus: 'active'
      });

      const followId = followResponse.body.id;

      // Verify follow appears in user's follows list
      const followsResponse = await request(app)
        .get('/api/v1/follows')
        .set(authHeaders())
        .expect(200);

      expect(followsResponse.body).toHaveLength(1);
      expect(followsResponse.body[0].id).toBe(followId);

      // Unfollow politician
      await request(app)
        .delete(`/api/v1/follows/${followId}`)
        .set(authHeaders())
        .expect(204);

      // Verify follow is removed from list
      const finalFollowsResponse = await request(app)
        .get('/api/v1/follows')
        .set(authHeaders())
        .expect(200);

      expect(finalFollowsResponse.body).toHaveLength(0);

      // Cleanup
      await db.query('DELETE FROM congressional_members WHERE id = $1', [testPoliticianId]);
    });

    it('should prevent duplicate follows', async () => {
      const politician = await db.insert('congressional_members', {
        id: uuidv4(),
        name: 'Duplicate Follow Test Senator',
        position: 'senator',
        state_code: 'OR',
        party_affiliation: 'independent',
        office_start_date: '2020-01-03'
      });

      // First follow should succeed
      await request(app)
        .post('/api/v1/follows')
        .set(authHeaders())
        .send({
          traderType: 'congressional',
          traderId: politician.id
        })
        .expect(201);

      // Second follow should fail
      await request(app)
        .post('/api/v1/follows')
        .set(authHeaders())
        .send({
          traderType: 'congressional',
          traderId: politician.id
        })
        .expect(400);

      // Cleanup
      await db.query('DELETE FROM user_follows WHERE user_id = $1', [testUserId]);
      await db.query('DELETE FROM congressional_members WHERE id = $1', [politician.id]);
    });
  });

  const cleanupAllTestData = async () => {
    await db.query('DELETE FROM user_follows WHERE user_id = $1', [testUserId]);
    await db.query('DELETE FROM users WHERE email LIKE %follows-test%');
  };
});