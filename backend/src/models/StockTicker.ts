import { db } from '../config/database';
import { PoolClient } from 'pg';

export interface StockTickerData {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  lastPrice?: number;
  lastUpdated?: Date;
  createdAt?: Date;
}

export interface CreateStockTickerData {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  lastPrice?: number;
}

export interface StockTickerFilters {
  sector?: string;
  industry?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface StockPriceUpdate {
  symbol: string;
  price: number;
  marketCap?: number;
}

export class StockTicker {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  lastPrice?: number;
  lastUpdated?: Date;
  createdAt?: Date;

  constructor(data: StockTickerData) {
    this.symbol = data.symbol.toUpperCase();
    this.companyName = data.companyName;
    this.sector = data.sector;
    this.industry = data.industry;
    this.marketCap = data.marketCap;
    this.lastPrice = data.lastPrice;
    this.lastUpdated = data.lastUpdated;
    this.createdAt = data.createdAt;
  }

  /**
   * Create a new stock ticker
   */
  static async create(tickerData: CreateStockTickerData): Promise<StockTicker> {
    // Validate required fields
    if (!tickerData.symbol || !tickerData.companyName) {
      throw new Error('Symbol and company name are required');
    }

    // Validate symbol format (1-10 characters, alphanumeric)
    const symbolRegex = /^[A-Z0-9]{1,10}$/;
    const upperSymbol = tickerData.symbol.toUpperCase();
    if (!symbolRegex.test(upperSymbol)) {
      throw new Error('Symbol must be 1-10 alphanumeric characters');
    }

    // Validate numeric fields
    if (tickerData.marketCap !== undefined && tickerData.marketCap < 0) {
      throw new Error('Market cap cannot be negative');
    }

    if (tickerData.lastPrice !== undefined && tickerData.lastPrice < 0) {
      throw new Error('Last price cannot be negative');
    }

    const client = await db.connect();
    try {
      // Check if ticker already exists
      const existingTicker = await client.query(
        'SELECT symbol FROM stock_tickers WHERE symbol = $1',
        [upperSymbol]
      );

      if (existingTicker.rows.length > 0) {
        throw new Error(`Stock ticker ${upperSymbol} already exists`);
      }

      // Insert new stock ticker
      const result = await client.query(
        `INSERT INTO stock_tickers 
         (symbol, company_name, sector, industry, market_cap, last_price, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          upperSymbol,
          tickerData.companyName,
          tickerData.sector || null,
          tickerData.industry || null,
          tickerData.marketCap || null,
          tickerData.lastPrice || null,
          tickerData.lastPrice ? new Date() : null
        ]
      );

      const tickerRow = result.rows[0];
      return new StockTicker({
        symbol: tickerRow.symbol,
        companyName: tickerRow.company_name,
        sector: tickerRow.sector,
        industry: tickerRow.industry,
        marketCap: tickerRow.market_cap,
        lastPrice: tickerRow.last_price,
        lastUpdated: tickerRow.last_updated,
        createdAt: tickerRow.created_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Find stock ticker by symbol
   */
  static async findBySymbol(symbol: string): Promise<StockTicker | null> {
    if (!symbol) {
      return null;
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM stock_tickers WHERE symbol = $1',
        [symbol.toUpperCase()]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const tickerRow = result.rows[0];
      return new StockTicker({
        symbol: tickerRow.symbol,
        companyName: tickerRow.company_name,
        sector: tickerRow.sector,
        industry: tickerRow.industry,
        marketCap: tickerRow.market_cap,
        lastPrice: tickerRow.last_price,
        lastUpdated: tickerRow.last_updated,
        createdAt: tickerRow.created_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Find multiple stock tickers by symbols
   */
  static async findBySymbols(symbols: string[]): Promise<StockTicker[]> {
    if (!symbols || symbols.length === 0) {
      return [];
    }

    const upperSymbols = symbols.map(s => s.toUpperCase());
    const client = await db.connect();
    try {
      const placeholders = upperSymbols.map((_, index) => `$${index + 1}`).join(',');
      const result = await client.query(
        `SELECT * FROM stock_tickers WHERE symbol IN (${placeholders}) ORDER BY symbol`,
        upperSymbols
      );

      return result.rows.map(row => new StockTicker({
        symbol: row.symbol,
        companyName: row.company_name,
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap,
        lastPrice: row.last_price,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Search stock tickers by symbol or company name
   */
  static async search(query: string, limit: number = 20): Promise<StockTicker[]> {
    if (!query.trim()) {
      return [];
    }

    const upperQuery = query.toUpperCase();
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM stock_tickers 
         WHERE symbol ILIKE $1 OR company_name ILIKE $2
         ORDER BY 
           CASE 
             WHEN symbol = $3 THEN 1
             WHEN symbol ILIKE $4 THEN 2
             WHEN company_name ILIKE $5 THEN 3
             ELSE 4
           END,
           symbol ASC
         LIMIT $6`,
        [
          `%${upperQuery}%`,
          `%${query}%`,
          upperQuery,
          `${upperQuery}%`,
          `${query}%`,
          limit
        ]
      );

      return result.rows.map(row => new StockTicker({
        symbol: row.symbol,
        companyName: row.company_name,
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap,
        lastPrice: row.last_price,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find all stock tickers with optional filters
   */
  static async findAll(
    filters: StockTickerFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<StockTicker[]> {
    const client = await db.connect();
    try {
      let query = 'SELECT * FROM stock_tickers WHERE 1=1';
      const params: any[] = [];
      let paramCounter = 1;

      // Apply filters
      if (filters.sector) {
        query += ` AND sector ILIKE $${paramCounter++}`;
        params.push(`%${filters.sector}%`);
      }

      if (filters.industry) {
        query += ` AND industry ILIKE $${paramCounter++}`;
        params.push(`%${filters.industry}%`);
      }

      if (filters.minMarketCap !== undefined) {
        query += ` AND market_cap >= $${paramCounter++}`;
        params.push(filters.minMarketCap);
      }

      if (filters.maxMarketCap !== undefined) {
        query += ` AND market_cap <= $${paramCounter++}`;
        params.push(filters.maxMarketCap);
      }

      if (filters.minPrice !== undefined) {
        query += ` AND last_price >= $${paramCounter++}`;
        params.push(filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query += ` AND last_price <= $${paramCounter++}`;
        params.push(filters.maxPrice);
      }

      query += ` ORDER BY symbol ASC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return result.rows.map(row => new StockTicker({
        symbol: row.symbol,
        companyName: row.company_name,
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap,
        lastPrice: row.last_price,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get tickers by sector
   */
  static async findBySector(sector: string, limit: number = 50): Promise<StockTicker[]> {
    return StockTicker.findAll({ sector }, limit);
  }

  /**
   * Get most traded tickers (by trade volume)
   */
  static async findMostTraded(days: number = 30, limit: number = 20): Promise<StockTicker[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT st.*, COUNT(trades.id) as trade_count
         FROM stock_tickers st
         INNER JOIN stock_trades trades ON st.symbol = trades.ticker_symbol
         WHERE trades.transaction_date >= NOW() - INTERVAL '${days} days'
         GROUP BY st.symbol, st.company_name, st.sector, st.industry, st.market_cap, st.last_price, st.last_updated, st.created_at
         ORDER BY trade_count DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map(row => new StockTicker({
        symbol: row.symbol,
        companyName: row.company_name,
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap,
        lastPrice: row.last_price,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Update stock ticker information
   */
  async update(updates: Partial<CreateStockTickerData>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (updates.companyName) {
      fields.push(`company_name = $${paramCounter++}`);
      values.push(updates.companyName);
    }

    if (updates.sector !== undefined) {
      fields.push(`sector = $${paramCounter++}`);
      values.push(updates.sector);
    }

    if (updates.industry !== undefined) {
      fields.push(`industry = $${paramCounter++}`);
      values.push(updates.industry);
    }

    if (updates.marketCap !== undefined) {
      if (updates.marketCap < 0) {
        throw new Error('Market cap cannot be negative');
      }
      fields.push(`market_cap = $${paramCounter++}`);
      values.push(updates.marketCap);
    }

    if (updates.lastPrice !== undefined) {
      if (updates.lastPrice < 0) {
        throw new Error('Last price cannot be negative');
      }
      fields.push(`last_price = $${paramCounter++}`);
      values.push(updates.lastPrice);
      fields.push(`last_updated = NOW()`);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(this.symbol);

    const client = await db.connect();
    try {
      await client.query(
        `UPDATE stock_tickers SET ${fields.join(', ')} WHERE symbol = $${paramCounter}`,
        values
      );

      // Update instance properties
      if (updates.companyName) this.companyName = updates.companyName;
      if (updates.sector !== undefined) this.sector = updates.sector;
      if (updates.industry !== undefined) this.industry = updates.industry;
      if (updates.marketCap !== undefined) this.marketCap = updates.marketCap;
      if (updates.lastPrice !== undefined) {
        this.lastPrice = updates.lastPrice;
        this.lastUpdated = new Date();
      }
    } finally {
      client.release();
    }
  }

  /**
   * Update stock price and market cap
   */
  async updatePrice(priceData: { price: number; marketCap?: number }): Promise<void> {
    if (priceData.price < 0) {
      throw new Error('Price cannot be negative');
    }

    const updates: Partial<CreateStockTickerData> = {
      lastPrice: priceData.price
    };

    if (priceData.marketCap !== undefined) {
      if (priceData.marketCap < 0) {
        throw new Error('Market cap cannot be negative');
      }
      updates.marketCap = priceData.marketCap;
    }

    await this.update(updates);
  }

  /**
   * Batch update multiple stock prices
   */
  static async batchUpdatePrices(priceUpdates: StockPriceUpdate[]): Promise<void> {
    if (!priceUpdates || priceUpdates.length === 0) {
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const update of priceUpdates) {
        if (update.price < 0) {
          throw new Error(`Price for ${update.symbol} cannot be negative`);
        }

        if (update.marketCap !== undefined && update.marketCap < 0) {
          throw new Error(`Market cap for ${update.symbol} cannot be negative`);
        }

        const fields = ['last_price = $2', 'last_updated = NOW()'];
        const values = [update.symbol.toUpperCase(), update.price];

        if (update.marketCap !== undefined) {
          fields.push('market_cap = $3');
          values.push(update.marketCap);
        }

        await client.query(
          `UPDATE stock_tickers SET ${fields.join(', ')} WHERE symbol = $1`,
          values
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get trading statistics for this ticker
   */
  async getTradingStats(days: number = 30): Promise<{
    totalTrades: number;
    totalValue: number;
    buyTrades: number;
    sellTrades: number;
    uniqueTraders: number;
  }> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total_trades,
           SUM(estimated_value) as total_value,
           SUM(CASE WHEN transaction_type = 'buy' THEN 1 ELSE 0 END) as buy_trades,
           SUM(CASE WHEN transaction_type = 'sell' THEN 1 ELSE 0 END) as sell_trades,
           COUNT(DISTINCT CONCAT(trader_type, '-', trader_id)) as unique_traders
         FROM stock_trades 
         WHERE ticker_symbol = $1 
         AND transaction_date >= NOW() - INTERVAL '${days} days'`,
        [this.symbol]
      );

      const stats = result.rows[0];
      return {
        totalTrades: parseInt(stats.total_trades) || 0,
        totalValue: parseFloat(stats.total_value) || 0,
        buyTrades: parseInt(stats.buy_trades) || 0,
        sellTrades: parseInt(stats.sell_trades) || 0,
        uniqueTraders: parseInt(stats.unique_traders) || 0
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all unique sectors
   */
  static async getAllSectors(): Promise<string[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT DISTINCT sector FROM stock_tickers WHERE sector IS NOT NULL ORDER BY sector'
      );
      return result.rows.map(row => row.sector);
    } finally {
      client.release();
    }
  }

  /**
   * Get all unique industries
   */
  static async getAllIndustries(): Promise<string[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT DISTINCT industry FROM stock_tickers WHERE industry IS NOT NULL ORDER BY industry'
      );
      return result.rows.map(row => row.industry);
    } finally {
      client.release();
    }
  }

  /**
   * Get tickers that need price updates (older than specified hours)
   */
  static async findStalePrice(hours: number = 24, limit: number = 100): Promise<StockTicker[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM stock_tickers 
         WHERE last_updated IS NULL 
         OR last_updated < NOW() - INTERVAL '${hours} hours'
         ORDER BY last_updated ASC NULLS FIRST
         LIMIT $1`,
        [limit]
      );

      return result.rows.map(row => new StockTicker({
        symbol: row.symbol,
        companyName: row.company_name,
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap,
        lastPrice: row.last_price,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Create ticker if it doesn't exist (upsert for company name only)
   */
  static async createIfNotExists(tickerData: CreateStockTickerData): Promise<StockTicker> {
    const existing = await StockTicker.findBySymbol(tickerData.symbol);
    if (existing) {
      // Update company name if it's different
      if (existing.companyName !== tickerData.companyName) {
        await existing.update({ companyName: tickerData.companyName });
      }
      return existing;
    }

    return StockTicker.create(tickerData);
  }

  /**
   * Format price for display
   */
  getFormattedPrice(): string {
    if (!this.lastPrice) {
      return 'N/A';
    }
    return `$${this.lastPrice.toFixed(2)}`;
  }

  /**
   * Format market cap for display
   */
  getFormattedMarketCap(): string {
    if (!this.marketCap) {
      return 'N/A';
    }

    if (this.marketCap >= 1e12) {
      return `$${(this.marketCap / 1e12).toFixed(1)}T`;
    } else if (this.marketCap >= 1e9) {
      return `$${(this.marketCap / 1e9).toFixed(1)}B`;
    } else if (this.marketCap >= 1e6) {
      return `$${(this.marketCap / 1e6).toFixed(1)}M`;
    } else {
      return `$${this.marketCap.toLocaleString()}`;
    }
  }

  /**
   * Check if price data is stale
   */
  isPriceStale(hours: number = 24): boolean {
    if (!this.lastUpdated) {
      return true;
    }
    const staleTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.lastUpdated < staleTime;
  }

  /**
   * Convert to JSON
   */
  toJSON(): StockTickerData {
    return {
      symbol: this.symbol,
      companyName: this.companyName,
      sector: this.sector,
      industry: this.industry,
      marketCap: this.marketCap,
      lastPrice: this.lastPrice,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt
    };
  }
}