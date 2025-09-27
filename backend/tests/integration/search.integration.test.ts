import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;
let testUserId: string;

describe('Search Integration Tests', () => {
  beforeAll(async () => {
    // TODO: Initialize test app and database
    // app = createTestApp();
    // await setupTestDatabase();
    
    // Ensure test database is clean and connected
    await db.testConnection();
    
    // Create test user and get auth token
    const testUser = {
      email: 'search-test@example.com',
      password: 'SearchTest123!',
      name: 'Search Test User'
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    authToken = registerResponse.body.token;
    testUserId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.query('DELETE FROM users WHERE email LIKE %search-test%');
    await db.query('DELETE FROM congressional_members WHERE name LIKE %Test%');
    await db.query('DELETE FROM stock_tickers WHERE symbol LIKE %TEST%');
    await db.close();
  });

  beforeEach(async () => {
    // Seed test data before each test
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const seedTestData = async () => {
    // Insert test congressional members
    await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Nancy Test Pelosi',
      position: 'representative',
      state_code: 'CA',
      district: 5,
      party_affiliation: 'democratic',
      office_start_date: '2021-01-03'
    });

    await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Ted Test Cruz',
      position: 'senator',
      state_code: 'TX',
      party_affiliation: 'republican',
      office_start_date: '2013-01-03'
    });

    await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Alexandria Test Ocasio-Cortez',
      position: 'representative',
      state_code: 'NY',
      district: 14,
      party_affiliation: 'democratic',
      office_start_date: '2019-01-03'
    });

    // Insert test stock tickers
    await db.insert('stock_tickers', {
      symbol: 'TESTPL',
      company_name: 'Test Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      market_cap: 3000000000000,
      last_price: 150.25,
      last_updated: new Date().toISOString()
    });

    await db.insert('stock_tickers', {
      symbol: 'TESTFT',
      company_name: 'Test Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software',
      market_cap: 2500000000000,
      last_price: 340.50,
      last_updated: new Date().toISOString()
    });

    await db.insert('stock_tickers', {
      symbol: 'TESTGL',
      company_name: 'Test Google LLC',
      sector: 'Technology',
      industry: 'Internet Services',
      market_cap: 1800000000000,
      last_price: 2750.00,
      last_updated: new Date().toISOString()
    });
  };

  const cleanupTestData = async () => {
    await db.query('DELETE FROM congressional_members WHERE name LIKE %Test%');
    await db.query('DELETE FROM stock_tickers WHERE symbol LIKE %TEST%');
  };

  describe('Search Functionality', () => {
    it('should search and return both politicians and stocks', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'test',
          type: 'all',
          limit: 20
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      expect(Array.isArray(response.body.politicians)).toBe(true);
      expect(Array.isArray(response.body.stocks)).toBe(true);

      // Verify politicians are returned
      expect(response.body.politicians.length).toBeGreaterThan(0);
      const politician = response.body.politicians[0];
      expect(politician).toHaveProperty('id');
      expect(politician).toHaveProperty('name');
      expect(politician).toHaveProperty('position');
      expect(politician).toHaveProperty('stateCode');
      expect(politician).toHaveProperty('partyAffiliation');
      expect(politician.name.toLowerCase()).toContain('test');

      // Verify stocks are returned
      expect(response.body.stocks.length).toBeGreaterThan(0);
      const stock = response.body.stocks[0];
      expect(stock).toHaveProperty('symbol');
      expect(stock).toHaveProperty('companyName');
      expect(stock).toHaveProperty('sector');
      expect(stock.symbol.includes('TEST') || stock.companyName.toLowerCase().includes('test')).toBe(true);
    });

    it('should search politicians by name', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'nancy',
          type: 'politician'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      expect(response.body.politicians.length).toBeGreaterThan(0);
      expect(response.body.stocks).toHaveLength(0); // Should be empty for politician-only search

      const nancy = response.body.politicians.find(p => p.name.toLowerCase().includes('nancy'));
      expect(nancy).toBeTruthy();
      expect(nancy.position).toBe('representative');
      expect(nancy.stateCode).toBe('CA');
      expect(nancy.district).toBe(5);
    });

    it('should search politicians by state', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'TX',
          type: 'politician'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.politicians.length).toBeGreaterThan(0);
      const texasPolitician = response.body.politicians.find(p => p.stateCode === 'TX');
      expect(texasPolitician).toBeTruthy();
      expect(texasPolitician.name.toLowerCase()).toContain('cruz');
    });

    it('should search stocks by symbol', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'TESTPL',
          type: 'stock'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
      expect(response.body.politicians).toHaveLength(0); // Should be empty for stock-only search
      expect(response.body.stocks.length).toBeGreaterThan(0);

      const testStock = response.body.stocks.find(s => s.symbol === 'TESTPL');
      expect(testStock).toBeTruthy();
      expect(testStock.companyName).toBe('Test Apple Inc.');
      expect(testStock.sector).toBe('Technology');
    });

    it('should search stocks by company name', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'microsoft',
          type: 'stock'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.stocks.length).toBeGreaterThan(0);
      const microsoft = response.body.stocks.find(s => s.companyName.toLowerCase().includes('microsoft'));
      expect(microsoft).toBeTruthy();
      expect(microsoft.symbol).toBe('TESTFT');
    });

    it('should respect search limit parameter', async () => {
      const limit = 2;
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'test',
          limit
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.politicians.length).toBeLessThanOrEqual(limit);
      expect(response.body.stocks.length).toBeLessThanOrEqual(limit);
    });

    it('should handle case-insensitive searches', async () => {
      const searches = ['TEST', 'test', 'Test', 'TeSt'];

      for (const query of searches) {
        const response = await request(app)
          .get('/api/v1/search')
          .set(authHeaders())
          .query({ q: query })
          .expect(200);

        expect(response.body.politicians.length + response.body.stocks.length).toBeGreaterThan(0);
      }
    });

    it('should handle special characters in search queries', async () => {
      // Test with hyphenated names
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'ocasio-cortez',
          type: 'politician'
        })
        .expect(200);

      expect(response.body.politicians.length).toBeGreaterThan(0);
      const aoc = response.body.politicians.find(p => p.name.toLowerCase().includes('ocasio-cortez'));
      expect(aoc).toBeTruthy();
    });

    it('should return empty results for non-existent queries', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'nonexistentqueryxyz123'
        })
        .expect(200);

      expect(response.body.politicians).toHaveLength(0);
      expect(response.body.stocks).toHaveLength(0);
    });
  });

  describe('Search Performance and Optimization', () => {
    it('should perform search within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'test',
          limit: 50
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should use database indexes effectively', async () => {
      // This test would verify that proper indexes are being used
      // Could be done by analyzing query execution plans
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'test',
          limit: 100
        })
        .expect(200);

      // Basic verification that search completes successfully
      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });
  });

  describe('Search Data Accuracy', () => {
    it('should return accurate politician information', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'nancy',
          type: 'politician'
        })
        .expect(200);

      const nancy = response.body.politicians.find(p => p.name.toLowerCase().includes('nancy'));
      expect(nancy).toBeTruthy();

      // Verify all required fields are present and accurate
      expect(nancy).toMatchObject({
        name: expect.stringContaining('Nancy'),
        position: 'representative',
        stateCode: 'CA',
        district: 5,
        partyAffiliation: 'democratic'
      });

      expect(nancy.officeStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return accurate stock information', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'TESTPL',
          type: 'stock'
        })
        .expect(200);

      const stock = response.body.stocks.find(s => s.symbol === 'TESTPL');
      expect(stock).toBeTruthy();

      // Verify all required fields are present and accurate
      expect(stock).toMatchObject({
        symbol: 'TESTPL',
        companyName: 'Test Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics'
      });

      expect(typeof stock.marketCap).toBe('number');
      expect(typeof stock.lastPrice).toBe('number');
      expect(stock.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle senators without district numbers', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'cruz',
          type: 'politician'
        })
        .expect(200);

      const cruz = response.body.politicians.find(p => p.name.toLowerCase().includes('cruz'));
      expect(cruz).toBeTruthy();
      expect(cruz.position).toBe('senator');
      expect(cruz.district).toBeNull(); // Senators don't have districts
    });
  });

  describe('Search Security and Validation', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate search parameters', async () => {
      // Missing query parameter
      const response1 = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .expect(400);

      expect(response1.body).toHaveProperty('error');

      // Invalid type parameter
      const response2 = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'test',
          type: 'invalid'
        })
        .expect(400);

      expect(response2.body).toHaveProperty('error');

      // Invalid limit parameter
      const response3 = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({
          q: 'test',
          limit: 101 // Above maximum
        })
        .expect(400);

      expect(response3.body).toHaveProperty('error');
    });

    it('should sanitize search input to prevent injection attacks', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '${process.env.DATABASE_PASSWORD}',
        '../../../etc/passwd'
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .get('/api/v1/search')
          .set(authHeaders())
          .query({ q: input })
          .expect(200); // Should not crash, just return empty results

        expect(response.body).toHaveProperty('politicians');
        expect(response.body).toHaveProperty('stocks');
      }
    });
  });

  describe('Search Edge Cases', () => {
    it('should handle very short search queries', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({ q: 'a' })
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({ q: longQuery })
        .expect(200);

      expect(response.body.politicians).toHaveLength(0);
      expect(response.body.stocks).toHaveLength(0);
    });

    it('should handle unicode characters', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({ q: 'José María' })
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });

    it('should handle numeric search queries', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set(authHeaders())
        .query({ q: '123' })
        .expect(200);

      expect(response.body).toHaveProperty('politicians');
      expect(response.body).toHaveProperty('stocks');
    });
  });
});