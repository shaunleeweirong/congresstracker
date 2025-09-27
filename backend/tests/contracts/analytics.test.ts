import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;

describe('Analytics Contract Tests', () => {
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
    // await seedAnalyticsTestData();
  });

  const validAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const validatePortfolioConcentration = (portfolioData: any) => {
    expect(portfolioData).toMatchObject({
      traderId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
      traderType: expect.stringMatching(/^(congressional|corporate)$/),
      holdings: expect.any(Array)
    });

    // Validate holdings array structure
    expect(Array.isArray(portfolioData.holdings)).toBe(true);
    
    portfolioData.holdings.forEach((holding: any) => {
      expect(holding).toMatchObject({
        tickerSymbol: expect.any(String),
        companyName: expect.any(String),
        netPositionValue: expect.any(Number),
        positionPercentage: expect.any(Number),
        transactionCount: expect.any(Number),
        latestTransaction: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      });

      // Validate numeric constraints
      expect(holding.netPositionValue).toBeGreaterThanOrEqual(0);
      expect(holding.positionPercentage).toBeGreaterThanOrEqual(0);
      expect(holding.positionPercentage).toBeLessThanOrEqual(100);
      expect(holding.transactionCount).toBeGreaterThan(0);
      
      // Validate ticker symbol length constraint
      expect(holding.tickerSymbol.length).toBeGreaterThan(0);
      expect(holding.tickerSymbol.length).toBeLessThanOrEqual(10);
    });
  };

  describe('GET /api/v1/analytics/portfolio-concentration/:traderId', () => {
    const validTraderId = uuidv4();

    it('should get portfolio concentration for congressional member', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      expect(response.body.traderId).toBe(validTraderId);
    });

    it('should get portfolio concentration for corporate insider', async () => {
      const corporateInsiderId = uuidv4();

      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${corporateInsiderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      expect(response.body.traderId).toBe(corporateInsiderId);
      expect(response.body.traderType).toBe('corporate');
    });

    it('should respect default limit of 10 holdings', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      expect(response.body.holdings.length).toBeLessThanOrEqual(10); // default limit
    });

    it('should respect custom limit parameter', async () => {
      const limit = 5;

      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .query({
          limit
        })
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      expect(response.body.holdings.length).toBeLessThanOrEqual(limit);
    });

    it('should limit to maximum 50 holdings', async () => {
      const limit = 50; // maximum allowed

      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .query({
          limit
        })
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      expect(response.body.holdings.length).toBeLessThanOrEqual(50);
    });

    it('should sort holdings by position percentage descending', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      
      // Verify holdings are sorted by position percentage (highest first)
      const holdings = response.body.holdings;
      for (let i = 1; i < holdings.length; i++) {
        expect(holdings[i-1].positionPercentage).toBeGreaterThanOrEqual(holdings[i].positionPercentage);
      }
    });

    it('should include only positive net positions', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      
      // All holdings should have positive net position values
      response.body.holdings.forEach((holding: any) => {
        expect(holding.netPositionValue).toBeGreaterThan(0);
      });
    });

    it('should calculate percentage correctly relative to total portfolio', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      
      // Sum of all position percentages should be approximately 100% or less
      // (can be less if we're showing top holdings only)
      const totalPercentage = response.body.holdings.reduce((sum: number, holding: any) => {
        return sum + holding.positionPercentage;
      }, 0);
      
      expect(totalPercentage).toBeLessThanOrEqual(100.1); // Allow small floating point errors
    });

    it('should return empty holdings for trader with no positive positions', async () => {
      const traderWithNoPositions = uuidv4();

      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${traderWithNoPositions}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        traderId: traderWithNoPositions,
        traderType: expect.stringMatching(/^(congressional|corporate)$/),
        holdings: []
      });
      
      expect(response.body.holdings).toHaveLength(0);
    });

    it('should return 404 for non-existent trader', async () => {
      const nonExistentTraderId = uuidv4();

      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${nonExistentTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for invalid trader ID format', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/portfolio-concentration/invalid-uuid')
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for limit below minimum (1)', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .query({
          limit: 0
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for limit above maximum (50)', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .query({
          limit: 51
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for invalid limit format', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .query({
          limit: 'invalid'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set({ Authorization: 'Bearer invalid-token' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set({ Authorization: 'InvalidFormat token' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should handle edge case of trader with single stock position', async () => {
      const singleStockTraderId = uuidv4();

      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${singleStockTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      
      if (response.body.holdings.length === 1) {
        // If trader has only one stock, it should be 100% of portfolio
        expect(response.body.holdings[0].positionPercentage).toBeCloseTo(100, 1);
      }
    });

    it('should only include recent transactions (within 2 years)', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/portfolio-concentration/${validTraderId}`)
        .set(validAuthHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      validatePortfolioConcentration(response.body);
      
      // All latest transactions should be within the last 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      response.body.holdings.forEach((holding: any) => {
        const latestTransactionDate = new Date(holding.latestTransaction);
        expect(latestTransactionDate).toBeGreaterThanOrEqual(twoYearsAgo);
      });
    });
  });
});