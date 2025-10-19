import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/config/database';

// This will be replaced with actual app once implemented
let app: Express;
let authToken: string;
let testStockSymbol: string;
let testPoliticianId: string;
let testCorporateInsiderId: string;

describe('Stock-Specific Trading Data Integration Tests', () => {
  beforeAll(async () => {
    await db.testConnection();
    
    // Create test user and get auth token
    const testUser = {
      email: 'stock-trades-test@example.com',
      password: 'StockTradesTest123!',
      name: 'Stock Trades Test User'
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
    await seedStockTradeTestData();
  });

  afterEach(async () => {
    await cleanupStockTradeTestData();
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`
  });

  const seedStockTradeTestData = async () => {
    testStockSymbol = 'STKTEST';

    // Create test stock
    await db.insert('stock_tickers', {
      symbol: testStockSymbol,
      company_name: 'Stock Test Corporation',
      sector: 'Technology',
      industry: 'Cloud Computing',
      market_cap: 2000000000,
      last_price: 250.75,
      last_updated: new Date().toISOString()
    });

    // Create test politicians and corporate insider
    const politician = await db.insert('congressional_members', {
      id: uuidv4(),
      name: 'Stock Test Senator',
      position: 'senator',
      state_code: 'NY',
      party_affiliation: 'democratic',
      office_start_date: '2020-01-03'
    });
    testPoliticianId = politician.id;

    const insider = await db.insert('corporate_insiders', {
      id: uuidv4(),
      name: 'Stock Test Insider',
      company_name: 'Stock Test Corporation',
      position: 'CEO',
      ticker_symbol: testStockSymbol
    });
    testCorporateInsiderId = insider.id;

    // Create various trades for the test stock
    const trades = [
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: testStockSymbol,
        transaction_date: '2024-01-15',
        transaction_type: 'buy',
        amount_range: '$50,001 - $100,000',
        estimated_value: 75000,
        quantity: 300,
        filing_date: '2024-01-20'
      },
      {
        id: uuidv4(),
        trader_type: 'corporate',
        trader_id: testCorporateInsiderId,
        ticker_symbol: testStockSymbol,
        transaction_date: '2024-02-10',
        transaction_type: 'sell',
        amount_range: '$100,001 - $250,000',
        estimated_value: 200000,
        quantity: 800,
        filing_date: '2024-02-15'
      },
      {
        id: uuidv4(),
        trader_type: 'congressional',
        trader_id: testPoliticianId,
        ticker_symbol: testStockSymbol,
        transaction_date: '2024-03-05',
        transaction_type: 'sell',
        amount_range: '$15,001 - $50,000',
        estimated_value: 30000,
        quantity: 120,
        filing_date: '2024-03-10'
      }
    ];

    for (const trade of trades) {
      await db.insert('stock_trades', trade);
    }
  };

  const cleanupStockTradeTestData = async () => {
    await db.query('DELETE FROM stock_trades WHERE ticker_symbol = $1', [testStockSymbol]);
    await db.query('DELETE FROM congressional_members WHERE id = $1', [testPoliticianId]);
    await db.query('DELETE FROM corporate_insiders WHERE id = $1', [testCorporateInsiderId]);
    await db.query('DELETE FROM stock_tickers WHERE symbol = $1', [testStockSymbol]);
  };

  const cleanupAllTestData = async () => {
    await db.query('DELETE FROM users WHERE email LIKE %stock-trades-test%');
    await cleanupStockTradeTestData();
  };

  describe('Stock-Specific Trade Retrieval', () => {
    it('should get all trades for a specific stock', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Should have 3 trades for this stock
      expect(response.body.data.length).toBe(3);

      // All trades should be for the specified stock
      response.body.data.forEach((trade: any) => {
        expect(trade.tickerSymbol).toBe(testStockSymbol);
      });
    });

    it('should include both congressional and corporate trades', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      const congressionalTrades = response.body.data.filter((t: any) => t.traderType === 'congressional');
      const corporateTrades = response.body.data.filter((t: any) => t.traderType === 'corporate');

      expect(congressionalTrades.length).toBe(2);
      expect(corporateTrades.length).toBe(1);

      // Verify trader IDs
      congressionalTrades.forEach((trade: any) => {
        expect(trade.traderId).toBe(testPoliticianId);
      });

      corporateTrades.forEach((trade: any) => {
        expect(trade.traderId).toBe(testCorporateInsiderId);
      });
    });

    it('should include trader information for each trade', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      response.body.data.forEach((trade: any) => {
        if (trade.trader) {
          if (trade.traderType === 'congressional') {
            expect(trade.trader).toMatchObject({
              id: testPoliticianId,
              name: expect.stringContaining('Stock Test Senator'),
              position: 'senator',
              stateCode: 'NY',
              partyAffiliation: 'democratic'
            });
          } else if (trade.traderType === 'corporate') {
            expect(trade.trader).toMatchObject({
              id: testCorporateInsiderId,
              name: expect.stringContaining('Stock Test Insider'),
              companyName: 'Stock Test Corporation',
              position: 'CEO'
            });
          }
        }
      });
    });

    it('should handle case-insensitive stock symbols', async () => {
      const lowerCaseResponse = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol.toLowerCase()}`)
        .set(authHeaders())
        .expect(200);

      expect(lowerCaseResponse.body.data.length).toBe(3);

      const upperCaseResponse = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol.toUpperCase()}`)
        .set(authHeaders())
        .expect(200);

      expect(upperCaseResponse.body.data.length).toBe(3);
    });

    it('should sort trades by date (most recent first)', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(1);

      for (let i = 1; i < response.body.data.length; i++) {
        const currentDate = new Date(response.body.data[i].transactionDate);
        const previousDate = new Date(response.body.data[i-1].transactionDate);
        expect(currentDate <= previousDate).toBe(true);
      }
    });
  });

  describe('Stock Trading Analytics', () => {
    it('should show comprehensive trading activity for a stock', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      // Calculate total volume and value
      let totalValue = 0;
      let totalQuantity = 0;
      let buyCount = 0;
      let sellCount = 0;

      response.body.data.forEach((trade: any) => {
        if (trade.estimatedValue) totalValue += trade.estimatedValue;
        if (trade.quantity) totalQuantity += trade.quantity;
        if (trade.transactionType === 'buy') buyCount++;
        if (trade.transactionType === 'sell') sellCount++;
      });

      expect(totalValue).toBe(305000); // 75000 + 200000 + 30000
      expect(totalQuantity).toBe(1220); // 300 + 800 + 120
      expect(buyCount).toBe(1);
      expect(sellCount).toBe(2);
    });

    it('should show institutional vs political trading patterns', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      const congressionalValue = response.body.data
        .filter((t: any) => t.traderType === 'congressional')
        .reduce((sum: number, t: any) => sum + (t.estimatedValue || 0), 0);

      const corporateValue = response.body.data
        .filter((t: any) => t.traderType === 'corporate')
        .reduce((sum: number, t: any) => sum + (t.estimatedValue || 0), 0);

      expect(congressionalValue).toBe(105000); // 75000 + 30000
      expect(corporateValue).toBe(200000);
    });

    it('should identify net buying vs selling pressure', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      let netBuyValue = 0;
      let netSellValue = 0;

      response.body.data.forEach((trade: any) => {
        if (trade.transactionType === 'buy' && trade.estimatedValue) {
          netBuyValue += trade.estimatedValue;
        } else if (trade.transactionType === 'sell' && trade.estimatedValue) {
          netSellValue += trade.estimatedValue;
        }
      });

      expect(netBuyValue).toBe(75000);
      expect(netSellValue).toBe(230000); // 200000 + 30000
      expect(netSellValue > netBuyValue).toBe(true); // Net selling pressure
    });
  });

  describe('Pagination and Performance', () => {
    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
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
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .query({
          page: 2,
          limit: 2
        })
        .expect(200);

      expect(response2.body.data.length).toBe(1);
    });

    it('should perform efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent stock symbols gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/trades/stock/NONEXISTENT')
        .set(authHeaders())
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate pagination parameters', async () => {
      const response1 = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .query({ page: 0 })
        .expect(400);

      expect(response1.body).toHaveProperty('error');

      const response2 = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .query({ limit: 101 })
        .expect(400);

      expect(response2.body).toHaveProperty('error');
    });

    it('should handle special characters in stock symbols', async () => {
      // Test with periods and hyphens (common in stock symbols)
      const response = await request(app)
        .get('/api/v1/trades/stock/BRK.A')
        .set(authHeaders())
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Data Integrity', () => {
    it('should ensure all trades belong to the specified stock', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      response.body.data.forEach((trade: any) => {
        expect(trade.tickerSymbol).toBe(testStockSymbol);
      });
    });

    it('should maintain consistent stock information across trades', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      response.body.data.forEach((trade: any) => {
        if (trade.stock) {
          expect(trade.stock.symbol).toBe(testStockSymbol);
          expect(trade.stock.companyName).toBe('Stock Test Corporation');
          expect(trade.stock.sector).toBe('Technology');
        }
      });
    });

    it('should validate trader-stock relationships for corporate insiders', async () => {
      const response = await request(app)
        .get(`/api/v1/trades/stock/${testStockSymbol}`)
        .set(authHeaders())
        .expect(200);

      const corporateTrades = response.body.data.filter((t: any) => t.traderType === 'corporate');

      corporateTrades.forEach((trade: any) => {
        if (trade.trader) {
          // Corporate insider should be associated with the company
          expect(trade.trader.companyName).toBe('Stock Test Corporation');
          expect(trade.trader.tickerSymbol).toBe(testStockSymbol);
        }
      });
    });
  });
});