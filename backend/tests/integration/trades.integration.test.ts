import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;
let testUserId: string;
let testPoliticianId: string;
let testStockSymbol: string;

describe('Trading Data Integration Tests', () => {
  beforeAll(async () => {
    // TODO: Initialize test app and database
    // app = createTestApp();
    // await setupTestDatabase();
    
    await db.testConnection();
    
    // Create test user and get auth token
    const testUser = {
      email: 'trades-test@example.com',
      password: 'TradesTest123!',
      name: 'Trades Test User'
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
    await seedTradeTestData();
  });

  afterEach(async () => {
    await cleanupTradeTestData();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const seedTradeTestData = async () => {
    // Create test politician
    const politician = await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Trade Test Senator',
      position: 'senator',
      state_code: 'CA',
      party_affiliation: 'democratic',
      office_start_date: '2020-01-03'
    });
    testPoliticianId = politician.id;

    // Create test stock
    testStockSymbol = 'TRADE';
    await db.insert('stock_tickers', {
      symbol: testStockSymbol,
      company_name: 'Trade Test Corporation',
      sector: 'Technology',
      industry: 'Software',
      market_cap: 1000000000,
      last_price: 100.50,
      last_updated: new Date().toISOString()
    });

    // Create multiple test trades with different characteristics
    const trades = [
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: testStockSymbol,
        transaction_date: '2024-01-15',
        transaction_type: 'buy',
        amount_range: '$15,001 - $50,000',
        estimated_value: 25000,
        quantity: 250,
        filing_date: '2024-01-20'
      },
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: testStockSymbol,
        transaction_date: '2024-02-10',
        transaction_type: 'sell',
        amount_range: '$5,001 - $15,000',
        estimated_value: 10000,
        quantity: 100,
        filing_date: '2024-02-15'
      },
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: 'AAPL',
        transaction_date: '2024-03-05',
        transaction_type: 'buy',
        amount_range: '$50,001 - $100,000',
        estimated_value: 75000,
        quantity: 500,
        filing_date: '2024-03-10'
      }
    ];

    for (const trade of trades) {
      await db.insert('stock_trades', trade);
    }
  };

  const cleanupTradeTestData = async () => {
    await db.query('DELETE FROM stock_trades WHERE trader_id = $1', [testPoliticianId]);
    await db.query('DELETE FROM congressional_members WHERE id = $1', [testPoliticianId]);
    await db.query('DELETE FROM stock_tickers WHERE symbol = $1', [testStockSymbol]);
  };

  const cleanupAllTestData = async () => {
    await db.query('DELETE FROM users WHERE email LIKE %trades-test%');
    await cleanupTradeTestData();
  };

  describe('General Trading Data Retrieval', () => {
    it('should get paginated list of trades with default parameters', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify pagination structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: expect.any(Number),
        pages: expect.any(Number)
      });

      // Verify trade data structure
      if (response.body.data.length > 0) {
        const trade = response.body.data[0];
        expect(trade).toMatchObject({
          id: expect.any(String),
          traderType: expect.stringMatching(/^(congressional|corporate)$/),
          traderId: expect.any(String),
          tickerSymbol: expect.any(String),
          transactionDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          transactionType: expect.stringMatching(/^(buy|sell|exchange)$/),
          amountRange: expect.any(String)
        });
      }
    });

    it('should filter trades by date range', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // All trades should be within the specified date range
      response.body.data.forEach((trade: any) => {
        const tradeDate = new Date(trade.transactionDate);
        expect(tradeDate >= new Date('2024-01-01')).toBe(true);
        expect(tradeDate <= new Date('2024-01-31')).toBe(true);
      });
    });

    it('should filter trades by transaction type', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          transactionType: 'buy'
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // All trades should be buy transactions
      response.body.data.forEach((trade: any) => {
        expect(trade.transactionType).toBe('buy');
      });
    });

    it('should filter trades by value range', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          minValue: 20000,
          maxValue: 80000
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // All trades should be within the value range
      response.body.data.forEach((trade: any) => {
        if (trade.estimatedValue) {
          expect(trade.estimatedValue).toBeGreaterThanOrEqual(20000);
          expect(trade.estimatedValue).toBeLessThanOrEqual(80000);
        }
      });
    });

    it('should filter trades by ticker symbol', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          tickerSymbol: testStockSymbol
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // All trades should be for the specified ticker
      response.body.data.forEach((trade: any) => {
        expect(trade.tickerSymbol).toBe(testStockSymbol);
      });
    });

    it('should support complex filtering combinations', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          transactionType: 'buy',
          minValue: 10000,
          tickerSymbol: testStockSymbol
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // Verify all filters are applied
      response.body.data.forEach((trade: any) => {
        const tradeDate = new Date(trade.transactionDate);
        expect(tradeDate >= new Date('2024-01-01')).toBe(true);
        expect(tradeDate <= new Date('2024-12-31')).toBe(true);
        expect(trade.transactionType).toBe('buy');
        expect(trade.tickerSymbol).toBe(testStockSymbol);
        if (trade.estimatedValue) {
          expect(trade.estimatedValue).toBeGreaterThanOrEqual(10000);
        }
      });
    });

    it('should handle custom pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          page: 2,
          limit: 5
        })
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Data Accuracy and Completeness', () => {
    it('should return complete trade information', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          tickerSymbol: testStockSymbol,
          limit: 1
        })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const trade = response.body.data[0];

      // Verify all expected fields are present
      expect(trade).toMatchObject({
        id: expect.any(String),
        traderType: 'congressional',
        traderId: testPoliticianId,
        tickerSymbol: testStockSymbol,
        transactionDate: expect.any(String),
        transactionType: expect.any(String),
        amountRange: expect.any(String)
      });

      // Verify optional fields if present
      if (trade.estimatedValue !== undefined) {
        expect(typeof trade.estimatedValue).toBe('number');
      }
      if (trade.quantity !== undefined) {
        expect(typeof trade.quantity).toBe('number');
      }
      if (trade.filingDate !== undefined) {
        expect(trade.filingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should include related trader and stock information', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          traderId: testPoliticianId,
          limit: 1
        })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const trade = response.body.data[0];

      // Verify trader information is included
      if (trade.trader) {
        expect(trade.trader).toMatchObject({
          id: testPoliticianId,
          name: expect.any(String),
          position: expect.any(String),
          stateCode: expect.any(String),
          partyAffiliation: expect.any(String)
        });
      }

      // Verify stock information is included
      if (trade.stock) {
        expect(trade.stock).toMatchObject({
          symbol: expect.any(String),
          companyName: expect.any(String),
          lastUpdated: expect.any(String)
        });
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          limit: 100
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should use proper sorting (most recent first)', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          limit: 10
        })
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          const currentDate = new Date(response.body.data[i].transactionDate);
          const previousDate = new Date(response.body.data[i-1].transactionDate);
          expect(currentDate <= previousDate).toBe(true);
        }
      }
    });
  });

  describe('Error Handling and Validation', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate filter parameters', async () => {
      // Invalid date format
      const response1 = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          startDate: 'invalid-date'
        })
        .expect(400);

      expect(response1.body).toHaveProperty('error');

      // Invalid transaction type
      const response2 = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          transactionType: 'invalid'
        })
        .expect(400);

      expect(response2.body).toHaveProperty('error');

      // Invalid pagination parameters
      const response3 = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          page: 0
        })
        .expect(400);

      expect(response3.body).toHaveProperty('error');

      const response4 = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          limit: 101 // Above maximum
        })
        .expect(400);

      expect(response4.body).toHaveProperty('error');
    });

    it('should handle empty result sets gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          tickerSymbol: 'NONEXISTENT',
          startDate: '2025-01-01',
          endDate: '2025-01-02'
        })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.pages).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle trades with minimal information', async () => {
      // Create a trade with only required fields
      const minimalTrade = {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: testStockSymbol,
        transaction_date: '2024-06-01',
        transaction_type: 'exchange',
        amount_range: 'Not Available'
      };

      await db.insert('stock_trades', minimalTrade);

      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          transactionType: 'exchange'
        })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const trade = response.body.data.find((t: any) => t.id === minimalTrade.id);
      expect(trade).toBeTruthy();
      expect(trade.transactionType).toBe('exchange');
    });

    it('should handle very large value filters', async () => {
      const response = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          minValue: 1000000000, // 1 billion
          maxValue: 9999999999  // 9.99 billion
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should handle date range edge cases', async () => {
      // Same start and end date
      const response1 = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          startDate: '2024-01-15',
          endDate: '2024-01-15'
        })
        .expect(200);

      expect(response1.body).toHaveProperty('data');

      // End date before start date
      const response2 = await request(app)
        .get('/api/v1/trades')
        .set(authHeaders())
        .query({
          startDate: '2024-12-31',
          endDate: '2024-01-01'
        })
        .expect(400);

      expect(response2.body).toHaveProperty('error');
    });
  });
});