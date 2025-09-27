import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

let app: Express;
let authToken: string;
let testPoliticianId: string;

describe('Analytics Integration Tests', () => {
  beforeAll(async () => {
    await db.testConnection();
    
    const testUser = {
      email: 'analytics-test@example.com',
      password: 'AnalyticsTest123!',
      name: 'Analytics Test User'
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await db.close();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  describe('Portfolio Concentration Analytics', () => {
    it('should calculate portfolio concentration correctly', async () => {
      // Create test politician
      const politician = await db.insert('congressional_members', {
        id: uuidv4(),
        name: 'Analytics Test Senator',
        position: 'senator',
        state_code: 'CO',
        party_affiliation: 'democratic',
        office_start_date: '2019-01-03'
      });
      testPoliticianId = politician.id;

      // Create test stocks and trades for portfolio analysis
      await db.insert('stock_tickers', {
        symbol: 'ANALY1',
        company_name: 'Analytics Test Corp 1',
        sector: 'Technology',
        last_updated: new Date().toISOString()
      });

      await db.insert('stock_tickers', {
        symbol: 'ANALY2', 
        company_name: 'Analytics Test Corp 2',
        sector: 'Healthcare',
        last_updated: new Date().toISOString()
      });

      // Create trades with different values to test concentration calculation
      await db.insert('stock_trades', {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: 'ANALY1',
        transaction_date: '2024-01-15',
        transaction_type: 'buy',
        estimated_value: 80000,
        quantity: 800
      });

      await db.insert('stock_trades', {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: 'ANALY2',
        transaction_date: '2024-02-10',
        transaction_type: 'buy',
        estimated_value: 20000,
        quantity: 200
      });

      // Get portfolio concentration
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      expect(response.body).toMatchObject({
        traderId: testPoliticianId,
        traderType: 'congressional',
        holdings: expect.any(Array)
      });

      expect(response.body.holdings.length).toBe(2);
      
      // Verify holdings are sorted by percentage
      const holdings = response.body.holdings;
      expect(holdings[0].positionPercentage).toBeGreaterThanOrEqual(holdings[1].positionPercentage);

      // Verify percentage calculations (80% and 20%)
      expect(holdings[0].positionPercentage).toBeCloseTo(80, 1);
      expect(holdings[1].positionPercentage).toBeCloseTo(20, 1);

      // Cleanup
      await db.query('DELETE FROM stock_trades WHERE trader_id = $1', [testPoliticianId]);
      await db.query('DELETE FROM congressional_members WHERE id = $1', [testPoliticianId]);
      await db.query('DELETE FROM stock_tickers WHERE symbol LIKE %ANALY%');
    });
  });

  const cleanupAllTestData = async () => {
    await db.query('DELETE FROM users WHERE email LIKE %analytics-test%');
  };
});