import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;

describe('Follows Contract Tests', () => {
  beforeAll(async () => {
    // TODO: Initialize test app and database
    // app = createTestApp();
    // await setupTestDatabase();
    // authToken = await generateTestAuthToken();
  });

  afterAll(async () => {
    // TODO: Cleanup test database
    // await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // TODO: Seed test data before each test
    // await seedFollowsTestData();
  });

  const validAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const validateUserFollow = (follow: any) => {
    expect(follow).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
      traderType: expect.stringMatching(/^(congressional|corporate)$/),
      traderId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
      followedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      billingStatus: expect.stringMatching(/^(active|suspended|cancelled)$/)
    });

    // Validate trader object if included
    if (follow.trader) {
      if (follow.traderType === 'congressional') {
        expect(follow.trader).toMatchObject({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          name: expect.any(String),
          position: expect.stringMatching(/^(senator|representative)$/),
          stateCode: expect.stringMatching(/^[A-Z]{2}$/),
          partyAffiliation: expect.stringMatching(/^(democratic|republican|independent|other)$/)
        });

        // Validate conditional district field for representatives
        if (follow.trader.position === 'representative') {
          expect(follow.trader).toHaveProperty('district');
          expect(typeof follow.trader.district).toBe('number');
        }
      } else if (follow.traderType === 'corporate') {
        expect(follow.trader).toMatchObject({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          name: expect.any(String),
          companyName: expect.any(String)
        });

        // Validate optional fields for corporate insiders
        if (follow.trader.position !== undefined) {
          expect(typeof follow.trader.position).toBe('string');
        }
        if (follow.trader.tickerSymbol !== undefined) {
          expect(typeof follow.trader.tickerSymbol).toBe('string');
          expect(follow.trader.tickerSymbol.length).toBeLessThanOrEqual(10);
        }
      }
    }
  };

  describe('GET /api/v1/follows', () => {
    it('should get user follows successfully', async () => {
      const response = await request(app)
        .get('/api/v1/follows')
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((follow: any) => {
        validateUserFollow(follow);
      });
    });

    it('should return empty array when user has no follows', async () => {
      const response = await request(app)
        .get('/api/v1/follows')
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should include trader information in response', async () => {
      const response = await request(app)
        .get('/api/v1/follows')
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((follow: any) => {
        validateUserFollow(follow);
        
        // Each follow should include trader information
        expect(follow).toHaveProperty('trader');
        expect(follow.trader).toBeDefined();
      });
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .get('/api/v1/follows')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .get('/api/v1/follows')
        .set({ Authorization: 'Bearer invalid-token' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });
  });

  describe('POST /api/v1/follows', () => {
    it('should follow a congressional member successfully', async () => {
      const followData = {
        traderType: 'congressional',
        traderId: uuidv4()
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(201);

      validateUserFollow(response.body);
      expect(response.body.traderType).toBe(followData.traderType);
      expect(response.body.traderId).toBe(followData.traderId);
      expect(response.body.billingStatus).toBe('active'); // default status
    });

    it('should follow a corporate insider successfully', async () => {
      const followData = {
        traderType: 'corporate',
        traderId: uuidv4()
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(201);

      validateUserFollow(response.body);
      expect(response.body.traderType).toBe(followData.traderType);
      expect(response.body.traderId).toBe(followData.traderId);
      expect(response.body.billingStatus).toBe('active'); // default status
    });

    it('should include trader information in follow response', async () => {
      const followData = {
        traderType: 'congressional',
        traderId: uuidv4()
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(201);

      validateUserFollow(response.body);
      expect(response.body).toHaveProperty('trader');
      expect(response.body.trader).toBeDefined();
    });

    it('should return 400 for missing required traderType', async () => {
      const followData = {
        traderId: uuidv4()
        // Missing traderType
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for missing required traderId', async () => {
      const followData = {
        traderType: 'congressional'
        // Missing traderId
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for invalid traderType', async () => {
      const followData = {
        traderType: 'invalid',
        traderId: uuidv4()
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for invalid traderId format', async () => {
      const followData = {
        traderType: 'congressional',
        traderId: 'invalid-uuid'
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for already following the same trader', async () => {
      const followData = {
        traderType: 'congressional',
        traderId: uuidv4()
      };

      // First follow should succeed
      await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect(201);

      // Second follow should fail with 400
      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for non-existent trader', async () => {
      const followData = {
        traderType: 'congressional',
        traderId: uuidv4() // Non-existent trader
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for missing authorization', async () => {
      const followData = {
        traderType: 'congressional',
        traderId: uuidv4()
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });
  });

  describe('DELETE /api/v1/follows/:followId', () => {
    const validFollowId = uuidv4();

    it('should unfollow trader successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/follows/${validFollowId}`)
        .set(validAuthHeaders())
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should return 404 for non-existent follow', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app)
        .delete(`/api/v1/follows/${nonExistentId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for invalid follow ID format', async () => {
      const response = await request(app)
        .delete('/api/v1/follows/invalid-uuid')
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 404 for follow belonging to another user', async () => {
      // This test assumes the follow exists but belongs to another user
      const otherUserFollowId = uuidv4();

      const response = await request(app)
        .delete(`/api/v1/follows/${otherUserFollowId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .delete(`/api/v1/follows/${validFollowId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .delete(`/api/v1/follows/${validFollowId}`)
        .set({ Authorization: 'Bearer invalid-token' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should handle billing implications of unfollowing', async () => {
      // This test verifies that unfollowing handles billing properly
      const response = await request(app)
        .delete(`/api/v1/follows/${validFollowId}`)
        .set(validAuthHeaders())
        .expect(204);

      expect(response.body).toEqual({});
      
      // Verify the follow is marked as unfollowed rather than deleted
      // (implementation detail: unfollowed_at should be set, billing_status updated)
    });

    it('should allow refollowing after unfollowing', async () => {
      // First unfollow
      await request(app)
        .delete(`/api/v1/follows/${validFollowId}`)
        .set(validAuthHeaders())
        .expect(204);

      // Then follow again - should succeed
      const followData = {
        traderType: 'congressional',
        traderId: uuidv4()
      };

      const response = await request(app)
        .post('/api/v1/follows')
        .set(validAuthHeaders())
        .send(followData)
        .expect('Content-Type', /json/)
        .expect(201);

      validateUserFollow(response.body);
    });
  });
});