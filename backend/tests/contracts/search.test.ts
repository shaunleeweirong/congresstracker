import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;

describe('Search Contract Tests', () => {
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
    // await seedSearchTestData();
  });

  describe('GET /api/v1/search', () => {
    const validAuthHeaders = () => ({
      Authorization: `Bearer ${authToken}`
    });

    it('should search politicians and stocks successfully', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test',
          type: 'all',
          limit: 20
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Validate response schema matches OpenAPI spec
      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      
      // Validate politicians array structure
      expect(Array.isArray(response.body.politicians)).toBe(true);
      if (response.body.politicians.length > 0) {
        const politician = response.body.politicians[0];
        expect(politician).toMatchObject({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          name: expect.any(String),
          position: expect.stringMatching(/^(senator|representative)$/),
          stateCode: expect.stringMatching(/^[A-Z]{2}$/),
          partyAffiliation: expect.stringMatching(/^(democratic|republican|independent|other)$/),
          officeStartDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        });

        // Validate conditional district field
        if (politician.position === 'representative') {
          expect(politician).toHaveProperty('district');
          expect(typeof politician.district).toBe('number');
        }

        // Validate optional fields
        if (politician.officeEndDate) {
          expect(politician.officeEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }

      // Validate stocks array structure
      expect(Array.isArray(response.body.stocks)).toBe(true);
      if (response.body.stocks.length > 0) {
        const stock = response.body.stocks[0];
        expect(stock).toMatchObject({
          symbol: expect.any(String),
          companyName: expect.any(String),
          lastUpdated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        });

        // Validate symbol length constraint
        expect(stock.symbol.length).toBeLessThanOrEqual(10);

        // Validate optional numeric fields
        if (stock.marketCap !== undefined) {
          expect(typeof stock.marketCap).toBe('number');
        }
        if (stock.lastPrice !== undefined) {
          expect(typeof stock.lastPrice).toBe('number');
        }
        if (stock.sector !== undefined) {
          expect(typeof stock.sector).toBe('string');
        }
        if (stock.industry !== undefined) {
          expect(typeof stock.industry).toBe('string');
        }
      }
    });

    it('should search only politicians when type=politician', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'nancy',
          type: 'politician',
          limit: 10
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      expect(Array.isArray(response.body.politicians)).toBe(true);
      expect(Array.isArray(response.body.stocks)).toBe(true);
      
      // When searching only for politicians, stocks array should be empty
      expect(response.body.stocks).toHaveLength(0);
    });

    it('should search only stocks when type=stock', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'AAPL',
          type: 'stock',
          limit: 10
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      expect(Array.isArray(response.body.politicians)).toBe(true);
      expect(Array.isArray(response.body.stocks)).toBe(true);
      
      // When searching only for stocks, politicians array should be empty
      expect(response.body.politicians).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test',
          type: 'all',
          limit: limit
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.politicians.length).toBeLessThanOrEqual(limit);
      expect(response.body.stocks.length).toBeLessThanOrEqual(limit);
    });

    it('should use default limit when not specified', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Default limit is 20 according to OpenAPI spec
      expect(response.body.politicians.length).toBeLessThanOrEqual(20);
      expect(response.body.stocks.length).toBeLessThanOrEqual(20);
    });

    it('should use default type=all when not specified', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          type: 'all',
          limit: 20
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Validate error response schema
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.code).toBe('string');
    });

    it('should return 400 for empty query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: '',
          type: 'all'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test',
          type: 'invalid_type'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for limit below minimum (1)', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test',
          limit: 0
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 400 for limit above maximum (100)', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'test',
          limit: 101
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for missing authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({
          q: 'test'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for invalid authorization token', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set({ Authorization: 'Bearer invalid-token' })
        .query({
          q: 'test'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set({ Authorization: 'InvalidFormat token' })
        .query({
          q: 'test'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
    });

    it('should handle special characters in search query', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'O\'Brien & Associates'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });

    it('should handle unicode characters in search query', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'José María'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });

    it('should return empty results for non-existent search terms', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(validAuthHeaders())
        .query({
          q: 'xyznonexistentquery123'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      expect(Array.isArray(response.body.politicians)).toBe(true);
      expect(Array.isArray(response.body.stocks)).toBe(true);
    });
  });
});