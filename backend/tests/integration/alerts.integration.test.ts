import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;
let testUserId: string;
let testPoliticianId: string;

describe('Alerts Integration Tests', () => {
  beforeAll(async () => {
    await db.testConnection();
    
    const testUser = {
      email: 'alerts-test@example.com',
      password: 'AlertsTest123!',
      name: 'Alerts Test User'
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

  beforeEach(async () => {
    await seedAlertTestData();
  });

  afterEach(async () => {
    await cleanupAlertTestData();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const seedAlertTestData = async () => {
    // Create test politician
    const politician = await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Alert Test Senator',
      position: 'senator',
      state_code: 'FL',
      party_affiliation: 'republican',
      office_start_date: '2021-01-03'
    });
    testPoliticianId = politician.id;

    // Create test stock
    await db.insert('stock_tickers', {
      symbol: 'ALERT',
      company_name: 'Alert Test Inc',
      sector: 'Technology',
      industry: 'Software',
      market_cap: 1000000000,
      last_price: 75.50,
      last_updated: new Date().toISOString()
    });
  };

  const cleanupAlertTestData = async () => {
    await db.query('DELETE FROM user_alerts WHERE user_id = $1', [testUserId]);
    await db.query('DELETE FROM congressional_members WHERE id = $1', [testPoliticianId]);
    await db.query('DELETE FROM stock_tickers WHERE symbol = $1', ['ALERT']);
  };

  const cleanupAllTestData = async () => {
    await db.query('DELETE FROM users WHERE email LIKE %alerts-test%');
    await cleanupAlertTestData();
  };

  describe('Alert Management Workflow', () => {
    it('should create, retrieve, update, and delete alerts', async () => {
      // Create politician alert
      const politicianAlert = {
        alertType: 'politician',
        politicianId: testPoliticianId
      };

      const createResponse = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send(politicianAlert)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        id: expect.any(String),
        alertType: 'politician',
        politicianId: testPoliticianId,
        alertStatus: 'active'
      });

      const alertId = createResponse.body.id;

      // Retrieve alerts
      const getResponse = await request(app)
        .get('/api/v1/alerts')
        .set(authHeaders())
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].id).toBe(alertId);

      // Update alert status
      const updateResponse = await request(app)
        .put(`/api/v1/alerts/${alertId}`)
        .set(authHeaders())
        .send({ alertStatus: 'paused' })
        .expect(200);

      expect(updateResponse.body.alertStatus).toBe('paused');

      // Delete alert
      await request(app)
        .delete(`/api/v1/alerts/${alertId}`)
        .set(authHeaders())
        .expect(204);

      // Verify deletion
      const finalGetResponse = await request(app)
        .get('/api/v1/alerts')
        .set(authHeaders())
        .expect(200);

      expect(finalGetResponse.body).toHaveLength(0);
    });

    it('should create different types of alerts', async () => {
      // Politician alert
      const politicianAlert = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'politician',
          politicianId: testPoliticianId
        })
        .expect(201);

      // Stock alert
      const stockAlert = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'ALERT'
        })
        .expect(201);

      // Pattern alert
      const patternAlert = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'pattern',
          patternConfig: {
            minValue: 50000,
            transactionType: 'buy',
            timeFrame: '24h'
          }
        })
        .expect(201);

      // Verify all alerts were created
      const response = await request(app)
        .get('/api/v1/alerts')
        .set(authHeaders())
        .expect(200);

      expect(response.body).toHaveLength(3);

      const alertTypes = response.body.map((alert: any) => alert.alertType);
      expect(alertTypes).toContain('politician');
      expect(alertTypes).toContain('stock');
      expect(alertTypes).toContain('pattern');
    });
  });

  describe('Alert Validation and Error Handling', () => {
    it('should validate alert creation parameters', async () => {
      // Missing alertType
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({ politicianId: testPoliticianId })
        .expect(400);

      // Invalid alertType
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({ alertType: 'invalid' })
        .expect(400);

      // Politician alert without politicianId
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({ alertType: 'politician' })
        .expect(400);

      // Stock alert without tickerSymbol
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({ alertType: 'stock' })
        .expect(400);

      // Pattern alert without patternConfig
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({ alertType: 'pattern' })
        .expect(400);
    });

    it('should require authentication for all operations', async () => {
      // Create without auth
      await request(app)
        .post('/api/v1/alerts')
        .send({ alertType: 'stock', tickerSymbol: 'ALERT' })
        .expect(401);

      // Get without auth
      await request(app)
        .get('/api/v1/alerts')
        .expect(401);

      // Update without auth
      await request(app)
        .put(`/api/v1/alerts/${uuidv4()}`)
        .send({ alertStatus: 'paused' })
        .expect(401);

      // Delete without auth
      await request(app)
        .delete(`/api/v1/alerts/${uuidv4()}`)
        .expect(401);
    });
  });

  describe('User Isolation', () => {
    it('should only show alerts for authenticated user', async () => {
      // Create alert for current user
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'ALERT'
        })
        .expect(201);

      // Create another user
      const otherUser = {
        email: 'other-alerts-test@example.com',
        password: 'OtherAlertsTest123!',
        name: 'Other Alerts Test User'
      };

      const otherUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(otherUser)
        .expect(201);

      const otherUserToken = otherUserResponse.body.token;

      // Other user should not see first user's alerts
      const otherUserAlerts = await request(app)
        .get('/api/v1/alerts')
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .expect(200);

      expect(otherUserAlerts.body).toHaveLength(0);

      // First user should still see their alert
      const firstUserAlerts = await request(app)
        .get('/api/v1/alerts')
        .set(authHeaders())
        .expect(200);

      expect(firstUserAlerts.body).toHaveLength(1);

      // Cleanup other user
      await db.query('DELETE FROM users WHERE email = $1', [otherUser.email]);
    });

    it('should prevent users from accessing other users alerts', async () => {
      // Create alert for current user
      const alertResponse = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'ALERT'
        })
        .expect(201);

      const alertId = alertResponse.body.id;

      // Create another user
      const otherUser = {
        email: 'other-alerts-access-test@example.com',
        password: 'OtherAlertsAccessTest123!',
        name: 'Other Alerts Access Test User'
      };

      const otherUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(otherUser)
        .expect(201);

      const otherUserToken = otherUserResponse.body.token;

      // Other user should not be able to update first user's alert
      await request(app)
        .put(`/api/v1/alerts/${alertId}`)
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .send({ alertStatus: 'paused' })
        .expect(404); // Alert not found for this user

      // Other user should not be able to delete first user's alert
      await request(app)
        .delete(`/api/v1/alerts/${alertId}`)
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .expect(404);

      // Cleanup other user
      await db.query('DELETE FROM users WHERE email = $1', [otherUser.email]);
    });
  });

  describe('Alert Configuration Validation', () => {
    it('should validate pattern alert configurations', async () => {
      // Valid pattern config
      const validPattern = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'pattern',
          patternConfig: {
            minValue: 10000,
            maxValue: 100000,
            transactionType: 'buy',
            timeFrame: '24h',
            sectors: ['Technology', 'Healthcare']
          }
        })
        .expect(201);

      expect(validPattern.body.patternConfig).toMatchObject({
        minValue: 10000,
        maxValue: 100000,
        transactionType: 'buy',
        timeFrame: '24h',
        sectors: ['Technology', 'Healthcare']
      });

      // Invalid pattern config (empty object)
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'pattern',
          patternConfig: {}
        })
        .expect(400);
    });

    it('should validate politician and stock references', async () => {
      // Valid politician ID
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'politician',
          politicianId: testPoliticianId
        })
        .expect(201);

      // Invalid politician ID format
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'politician',
          politicianId: 'invalid-uuid'
        })
        .expect(400);

      // Non-existent politician ID
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'politician',
          politicianId: uuidv4()
        })
        .expect(400);

      // Valid stock symbol
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'ALERT'
        })
        .expect(201);

      // Non-existent stock symbol
      await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'NONEXISTENT'
        })
        .expect(400);
    });
  });

  describe('Alert Status Management', () => {
    it('should handle all valid status transitions', async () => {
      const alertResponse = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'ALERT'
        })
        .expect(201);

      const alertId = alertResponse.body.id;

      // Pause alert
      const pausedResponse = await request(app)
        .put(`/api/v1/alerts/${alertId}`)
        .set(authHeaders())
        .send({ alertStatus: 'paused' })
        .expect(200);

      expect(pausedResponse.body.alertStatus).toBe('paused');

      // Reactivate alert
      const activeResponse = await request(app)
        .put(`/api/v1/alerts/${alertId}`)
        .set(authHeaders())
        .send({ alertStatus: 'active' })
        .expect(200);

      expect(activeResponse.body.alertStatus).toBe('active');

      // Mark as deleted
      const deletedResponse = await request(app)
        .put(`/api/v1/alerts/${alertId}`)
        .set(authHeaders())
        .send({ alertStatus: 'deleted' })
        .expect(200);

      expect(deletedResponse.body.alertStatus).toBe('deleted');
    });

    it('should reject invalid status values', async () => {
      const alertResponse = await request(app)
        .post('/api/v1/alerts')
        .set(authHeaders())
        .send({
          alertType: 'stock',
          tickerSymbol: 'ALERT'
        })
        .expect(201);

      const alertId = alertResponse.body.id;

      await request(app)
        .put(`/api/v1/alerts/${alertId}`)
        .set(authHeaders())
        .send({ alertStatus: 'invalid-status' })
        .expect(400);
    });
  });
});