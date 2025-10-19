import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;
let testPoliticianId: string;
let testPolitician2Id: string;

describe('Politician-Specific Trading Data Integration Tests', () => {
  beforeAll(async () => {
    // TODO: Initialize test app and database
    // app = createTestApp();
    // await setupTestDatabase();
    
    await db.testConnection();
    
    // Create test user and get auth token
    const testUser = {
      email: 'politician-trades-test@example.com',
      password: 'PoliticianTradesTest123!',
      name: 'Politician Trades Test User'
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

  beforeEach(async () => {
    await seedPoliticianTradeTestData();
  });

  afterEach(async () => {
    await cleanupPoliticianTradeTestData();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const seedPoliticianTradeTestData = async () => {
    // Create test politicians
    const politician1 = await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Senator Test Smith',
      position: 'senator',
      state_code: 'TX',
      party_affiliation: 'republican',
      office_start_date: '2019-01-03'
    });
    testPoliticianId = politician1.id;

    const politician2 = await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Representative Test Johnson',
      position: 'representative',
      state_code: 'CA',
      district: 12,
      party_affiliation: 'democratic',
      office_start_date: '2021-01-03'
    });
    testPolitician2Id = politician2.id;

    // Create test stocks
    await db.insert('stock_tickers', {
      symbol: 'POLTEST1',
      company_name: 'Politician Test Corp 1',
      sector: 'Technology',
      industry: 'Software',
      market_cap: 500000000,
      last_price: 50.25,
      last_updated: new Date().toISOString()
    });

    await db.insert('stock_tickers', {
      symbol: 'POLTEST2',
      company_name: 'Politician Test Corp 2',
      sector: 'Healthcare',
      industry: 'Pharmaceuticals',
      market_cap: 800000000,
      last_price: 120.75,
      last_updated: new Date().toISOString()
    });

    // Create trades for politician 1
    const politician1Trades = [
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: 'POLTEST1',
        transaction_date: '2024-01-15',
        transaction_type: 'buy',
        amount_range: '$15,001 - $50,000',
        estimated_value: 30000,
        quantity: 600,
        filing_date: '2024-01-20'
      },
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: 'POLTEST2',
        transaction_date: '2024-02-10',
        transaction_type: 'buy',
        amount_range: '$50,001 - $100,000',
        estimated_value: 75000,
        quantity: 620,
        filing_date: '2024-02-15'
      },
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: 'POLTEST1',
        transaction_date: '2024-03-05',
        transaction_type: 'sell',
        amount_range: '$5,001 - $15,000',
        estimated_value: 12000,
        quantity: 240,
        filing_date: '2024-03-10'
      }
    ];

    // Create trades for politician 2
    const politician2Trades = [
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPolitician2Id,
        ticker_symbol: 'POLTEST1',
        transaction_date: '2024-01-20',
        transaction_type: 'buy',
        amount_range: '$1,001 - $15,000',
        estimated_value: 8000,
        quantity: 160,
        filing_date: '2024-01-25'
      }
    ];

    const allTrades = [...politician1Trades, ...politician2Trades];
    for (const trade of allTrades) {
      await db.insert('stock_trades', trade);
    }
  };

  const cleanupPoliticianTradeTestData = async () => {
    await db.query('DELETE FROM stock_trades WHERE trader_id IN ($1, $2)', [testPoliticianId, testPolitician2Id]);
    await db.query('DELETE FROM congressional_members WHERE id IN ($1, $2)', [testPoliticianId, testPolitician2Id]);
    await db.query('DELETE FROM stock_tickers WHERE symbol LIKE %POLTEST%');
  };

  const cleanupAllTestData = async () => {
    await db.query('DELETE FROM users WHERE email LIKE %politician-trades-test%');
    await cleanupPoliticianTradeTestData();
  };

  describe('Politician-Specific Trade Retrieval', () => {
    it('should get all trades for a specific politician', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify pagination structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Should have 3 trades for this politician
      expect(response.body.data.length).toBe(3);

      // All trades should belong to the specified politician
      response.body.data.forEach((trade: any) => {
        expect(trade.traderId).toBe(testPoliticianId);
        expect(trade.traderType).toBe('congressional');
      });

      // Verify trade data structure
      const trade = response.body.data[0];
      expect(trade).toMatchObject({
        id: expect.any(String),
        traderType: 'congressional',
        traderId: testPoliticianId,
        tickerSymbol: expect.any(String),
        transactionDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        transactionType: expect.stringMatching(/^(buy|sell|exchange)$/),
        amountRange: expect.any(String)
      });
    });

    it('should return trades sorted by date (most recent first)', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(1);

      // Verify trades are sorted by transaction date descending
      for (let i = 1; i < response.body.data.length; i++) {
        const currentDate = new Date(response.body.data[i].transactionDate);
        const previousDate = new Date(response.body.data[i-1].transactionDate);
        expect(currentDate <= previousDate).toBe(true);
      }
    });

    it('should include politician information in response', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      const trade = response.body.data[0];
      
      // Verify trader information is included
      if (trade.trader) {
        expect(trade.trader).toMatchObject({
          id: testPoliticianId,
          name: 'Senator Test Smith',
          position: 'senator',
          stateCode: 'TX',
          partyAffiliation: 'republican'
        });
        expect(trade.trader.district).toBeNull(); // Senators don't have districts
      }
    });

    it('should handle pagination for politician trades', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .query({
          page: 1,
          limit: 2
        })
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });

      expect(response.body.data.length).toBe(2);

      // Test second page
      const response2 = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .query({
          page: 2,
          limit: 2
        })
        .expect(200);

      expect(response2.body.pagination.page).toBe(2);
      expect(response2.body.data.length).toBe(1);
    });

    it('should include stock information for each trade', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      const trade = response.body.data[0];
      
      // Verify stock information is included
      if (trade.stock) {
        expect(trade.stock).toMatchObject({
          symbol: expect.stringMatching(/^POLTEST[12]$/),
          companyName: expect.stringContaining('Politician Test Corp'),
          lastUpdated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        });

        if (trade.stock.marketCap !== undefined) {
          expect(typeof trade.stock.marketCap).toBe('number');
        }
        if (trade.stock.lastPrice !== undefined) {
          expect(typeof trade.stock.lastPrice).toBe('number');
        }
      }
    });
  });

  describe('Trade Analytics and Patterns', () => {
    it('should show trading patterns for a politician', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      expect(response.body.data.length).toBe(3);

      // Count buy vs sell transactions
      const buyTrades = response.body.data.filter((t: any) => t.transactionType === 'buy');
      const sellTrades = response.body.data.filter((t: any) => t.transactionType === 'sell');

      expect(buyTrades.length).toBe(2);
      expect(sellTrades.length).toBe(1);

      // Verify value ranges
      const totalEstimatedValue = response.body.data.reduce((sum: number, trade: any) => {
        return sum + (trade.estimatedValue || 0);
      }, 0);

      expect(totalEstimatedValue).toBeGreaterThan(0);
    });

    it('should show stock diversification for a politician', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      // Collect unique stocks traded
      const stocksTraded = new Set();
      response.body.data.forEach((trade: any) => {
        stocksTraded.add(trade.tickerSymbol);
      });

      expect(stocksTraded.size).toBe(2); // POLTEST1 and POLTEST2
      expect(stocksTraded.has('POLTEST1')).toBe(true);
      expect(stocksTraded.has('POLTEST2')).toBe(true);
    });

    it('should calculate net position for each stock', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      // Group trades by stock
      const stockTrades: { [key: string]: any[] } = {};
      response.body.data.forEach((trade: any) => {
        if (!stockTrades[trade.tickerSymbol]) {
          stockTrades[trade.tickerSymbol] = [];
        }
        stockTrades[trade.tickerSymbol].push(trade);
      });

      // For POLTEST1: bought 600 shares, sold 240 shares = net 360 shares
      const poltest1Trades = stockTrades['POLTEST1'];
      expect(poltest1Trades.length).toBe(2);
      
      const poltest1Buy = poltest1Trades.find((t: any) => t.transactionType === 'buy');
      const poltest1Sell = poltest1Trades.find((t: any) => t.transactionType === 'sell');
      
      expect(poltest1Buy.quantity).toBe(600);
      expect(poltest1Sell.quantity).toBe(240);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should return 404 for non-existent politician', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app)
        .get(`/api/v1/trades/politician/${nonExistentId}`)
        .set(authHeaders())
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/politician.*not.*found/i);
    });

    it('should return 400 for invalid politician ID format', async () => {
      const response = await request(app)
        .get('/api/v1/trades/politician/invalid-uuid')
        .set(authHeaders())
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle politician with no trades', async () => {
      // Create a politician with no trades
      const politicianWithNoTrades = await db.insert('congressional_members', {
        id: uuidv4(),
        name: 'No Trades Politician',
        position: 'representative',
        state_code: 'FL',
        district: 5,
        party_affiliation: 'independent',
        office_start_date: '2023-01-03'
      });

      const response = await request(app)
        .get(`/api/v1/trades/politician/${politicianWithNoTrades.id}`)
        .set(authHeaders())
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.pages).toBe(0);

      // Cleanup
      await db.query('DELETE FROM congressional_members WHERE id = $1', [politicianWithNoTrades.id]);
    });

    it('should validate pagination parameters', async () => {
      // Invalid page number
      const response1 = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .query({
          page: 0
        })
        .expect(400);

      expect(response1.body).toHaveProperty('error');

      // Invalid limit
      const response2 = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .query({
          limit: 101
        })
        .expect(400);

      expect(response2.body).toHaveProperty('error');
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should ensure all trades belong to the specified politician', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      // Every trade should have the correct trader_id
      response.body.data.forEach((trade: any) => {
        expect(trade.traderId).toBe(testPoliticianId);
        expect(trade.traderType).toBe('congressional');
      });
    });

    it('should not return trades from other politicians', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      // Should not include any trades from testPolitician2Id
      const otherPoliticianTrades = response.body.data.filter((trade: any) => 
        trade.traderId === testPolitician2Id
      );

      expect(otherPoliticianTrades).toHaveLength(0);
    });

    it('should maintain referential integrity for related data', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      response.body.data.forEach((trade: any) => {
        // Verify ticker symbol references a valid stock
        expect(['POLTEST1', 'POLTEST2']).toContain(trade.tickerSymbol);

        // Verify trader information is consistent
        if (trade.trader) {
          expect(trade.trader.id).toBe(testPoliticianId);
        }

        // Verify stock information is consistent
        if (trade.stock) {
          expect(trade.stock.symbol).toBe(trade.tickerSymbol);
        }
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should perform efficiently with multiple trades', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle large page sizes efficiently', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/politician/${testPoliticianId}`)
        .set(authHeaders())
        .query({
          limit: 100
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });
  });
});