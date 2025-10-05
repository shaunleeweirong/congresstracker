import { db } from '../config/database';
import { PoolClient } from 'pg';

export type TraderType = 'congressional' | 'corporate';
export type TransactionType = 'buy' | 'sell' | 'exchange';

export interface StockTradeData {
  id?: string;
  traderType: TraderType;
  traderId: string;
  tickerSymbol: string;
  transactionDate: Date;
  transactionType: TransactionType;
  amountRange?: string;
  estimatedValue?: number;
  quantity?: number;
  filingDate?: Date;
  sourceData?: any; // JSONB data from FMP API
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateStockTradeData {
  traderType: TraderType;
  traderId: string;
  tickerSymbol: string;
  transactionDate: Date;
  transactionType: TransactionType;
  amountRange?: string;
  estimatedValue?: number;
  quantity?: number;
  filingDate?: Date;
  sourceData?: any;
}

export interface StockTradeFilters {
  traderType?: TraderType;
  traderId?: string;
  tickerSymbol?: string;
  transactionType?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
  hasFilingDate?: boolean;
}

export interface TradeWithTrader extends StockTradeData {
  trader?: {
    id: string;
    name: string;
    position?: string;
    stateCode?: string;
    district?: number;
    partyAffiliation?: string;
    companyName?: string;
  };
  stock?: {
    symbol: string;
    companyName: string;
    sector?: string;
    lastPrice?: number;
  };
}

export class StockTrade {
  id?: string;
  traderType: TraderType;
  traderId: string;
  tickerSymbol: string;
  transactionDate: Date;
  transactionType: TransactionType;
  amountRange?: string;
  estimatedValue?: number;
  quantity?: number;
  filingDate?: Date;
  sourceData?: any;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: StockTradeData) {
    this.id = data.id;
    this.traderType = data.traderType;
    this.traderId = data.traderId;
    this.tickerSymbol = data.tickerSymbol.toUpperCase();
    this.transactionDate = data.transactionDate;
    this.transactionType = data.transactionType;
    this.amountRange = data.amountRange;
    this.estimatedValue = data.estimatedValue;
    this.quantity = data.quantity;
    this.filingDate = data.filingDate;
    this.sourceData = data.sourceData;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Create a new stock trade
   */
  static async create(tradeData: CreateStockTradeData): Promise<StockTrade> {
    // Validate required fields
    if (!tradeData.traderType || !tradeData.traderId || !tradeData.tickerSymbol || 
        !tradeData.transactionDate || !tradeData.transactionType) {
      throw new Error('Trader type, trader ID, ticker symbol, transaction date, and transaction type are required');
    }

    // Validate trader type
    if (!['congressional', 'corporate'].includes(tradeData.traderType)) {
      throw new Error('Trader type must be either "congressional" or "corporate"');
    }

    // Validate transaction type
    if (!['buy', 'sell', 'exchange'].includes(tradeData.transactionType)) {
      throw new Error('Transaction type must be "buy", "sell", or "exchange"');
    }

    // Validate numeric fields
    if (tradeData.estimatedValue !== undefined && tradeData.estimatedValue < 0) {
      throw new Error('Estimated value cannot be negative');
    }

    if (tradeData.quantity !== undefined && tradeData.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // Validate dates
    if (tradeData.filingDate && tradeData.filingDate < tradeData.transactionDate) {
      throw new Error('Filing date cannot be before transaction date');
    }

    const client = await db.connect();
    try {
      // Verify that the trader exists
      await StockTrade.validateTraderExists(client, tradeData.traderType, tradeData.traderId);

      // Verify that the ticker exists (create if not exists for flexibility)
      await StockTrade.validateTickerExists(client, tradeData.tickerSymbol);

      // Insert new stock trade
      const result = await client.query(
        `INSERT INTO stock_trades 
         (trader_type, trader_id, ticker_symbol, transaction_date, transaction_type, 
          amount_range, estimated_value, quantity, filing_date, source_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          tradeData.traderType,
          tradeData.traderId,
          tradeData.tickerSymbol.toUpperCase(),
          tradeData.transactionDate,
          tradeData.transactionType,
          tradeData.amountRange || null,
          tradeData.estimatedValue || null,
          tradeData.quantity || null,
          tradeData.filingDate || null,
          tradeData.sourceData ? JSON.stringify(tradeData.sourceData) : null
        ]
      );

      const tradeRow = result.rows[0];
      return new StockTrade({
        id: tradeRow.id,
        traderType: tradeRow.trader_type,
        traderId: tradeRow.trader_id,
        tickerSymbol: tradeRow.ticker_symbol,
        transactionDate: tradeRow.transaction_date,
        transactionType: tradeRow.transaction_type,
        amountRange: tradeRow.amount_range,
        estimatedValue: tradeRow.estimated_value,
        quantity: tradeRow.quantity,
        filingDate: tradeRow.filing_date,
        sourceData: tradeRow.source_data,
        createdAt: tradeRow.created_at,
        updatedAt: tradeRow.updated_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Validate that trader exists
   */
  private static async validateTraderExists(
    client: PoolClient,
    traderType: TraderType,
    traderId: string
  ): Promise<void> {
    let tableName: string;
    
    switch (traderType) {
      case 'congressional':
        tableName = 'congressional_members';
        break;
      case 'corporate':
        tableName = 'corporate_insiders';
        break;
      default:
        throw new Error(`Invalid trader type: ${traderType}`);
    }

    const result = await client.query(
      `SELECT id FROM ${tableName} WHERE id = $1`,
      [traderId]
    );

    if (result.rows.length === 0) {
      throw new Error(`${traderType} trader with ID ${traderId} does not exist`);
    }
  }

  /**
   * Validate that ticker exists
   */
  private static async validateTickerExists(client: PoolClient, tickerSymbol: string): Promise<void> {
    const result = await client.query(
      'SELECT symbol FROM stock_tickers WHERE symbol = $1',
      [tickerSymbol.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new Error(`Stock ticker ${tickerSymbol.toUpperCase()} does not exist`);
    }
  }

  /**
   * Find stock trade by ID
   */
  static async findById(id: string): Promise<StockTrade | null> {
    if (!id) {
      return null;
    }

    const result = await db.findById('stock_trades', id);
    if (!result) {
      return null;
    }

    return new StockTrade({
      id: result.id,
      traderType: result.trader_type,
      traderId: result.trader_id,
      tickerSymbol: result.ticker_symbol,
      transactionDate: result.transaction_date,
      transactionType: result.transaction_type,
      amountRange: result.amount_range,
      estimatedValue: result.estimated_value,
      quantity: result.quantity,
      filingDate: result.filing_date,
      sourceData: result.source_data,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    });
  }

  /**
   * Find trades with filters and include trader/stock information
   */
  static async findWithDetails(
    filters: StockTradeFilters = {},
    limit: number = 50,
    offset: number = 0,
    orderBy: string = 'transaction_date DESC'
  ): Promise<TradeWithTrader[]> {
    const client = await db.connect();
    try {
      let query = `
        SELECT 
          st.*,
          CASE 
            WHEN st.trader_type = 'congressional' THEN 
              json_build_object(
                'id', cm.id,
                'name', cm.name,
                'position', cm.position,
                'stateCode', cm.state_code,
                'district', cm.district,
                'partyAffiliation', cm.party_affiliation
              )
            WHEN st.trader_type = 'corporate' THEN
              json_build_object(
                'id', ci.id,
                'name', ci.name,
                'companyName', ci.company_name,
                'position', ci.position
              )
            ELSE NULL
          END as trader,
          json_build_object(
            'symbol', ticker.symbol,
            'companyName', ticker.company_name,
            'sector', ticker.sector,
            'lastPrice', ticker.last_price
          ) as stock
        FROM stock_trades st
        LEFT JOIN congressional_members cm ON st.trader_type = 'congressional' AND st.trader_id = cm.id
        LEFT JOIN corporate_insiders ci ON st.trader_type = 'corporate' AND st.trader_id = ci.id
        LEFT JOIN stock_tickers ticker ON st.ticker_symbol = ticker.symbol
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCounter = 1;

      // Apply filters
      if (filters.traderType) {
        query += ` AND st.trader_type = $${paramCounter++}`;
        params.push(filters.traderType);
      }

      if (filters.traderId) {
        query += ` AND st.trader_id = $${paramCounter++}`;
        params.push(filters.traderId);
      }

      if (filters.tickerSymbol) {
        query += ` AND st.ticker_symbol = $${paramCounter++}`;
        params.push(filters.tickerSymbol.toUpperCase());
      }

      if (filters.transactionType) {
        query += ` AND st.transaction_type = $${paramCounter++}`;
        params.push(filters.transactionType);
      }

      if (filters.startDate) {
        query += ` AND st.transaction_date >= $${paramCounter++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND st.transaction_date <= $${paramCounter++}`;
        params.push(filters.endDate);
      }

      if (filters.minValue !== undefined) {
        query += ` AND st.estimated_value >= $${paramCounter++}`;
        params.push(filters.minValue);
      }

      if (filters.maxValue !== undefined) {
        query += ` AND st.estimated_value <= $${paramCounter++}`;
        params.push(filters.maxValue);
      }

      if (filters.hasFilingDate === true) {
        query += ' AND st.filing_date IS NOT NULL';
      } else if (filters.hasFilingDate === false) {
        query += ' AND st.filing_date IS NULL';
      }

      query += ` ORDER BY st.${orderBy} LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        traderType: row.trader_type,
        traderId: row.trader_id,
        tickerSymbol: row.ticker_symbol,
        transactionDate: row.transaction_date,
        transactionType: row.transaction_type,
        amountRange: row.amount_range,
        estimatedValue: row.estimated_value,
        quantity: row.quantity,
        filingDate: row.filing_date,
        sourceData: row.source_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        trader: row.trader,
        stock: row.stock
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find trades by trader
   */
  static async findByTrader(
    traderType: TraderType,
    traderId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<StockTrade[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM stock_trades 
         WHERE trader_type = $1 AND trader_id = $2
         ORDER BY transaction_date DESC
         LIMIT $3 OFFSET $4`,
        [traderType, traderId, limit, offset]
      );

      return result.rows.map(row => new StockTrade({
        id: row.id,
        traderType: row.trader_type,
        traderId: row.trader_id,
        tickerSymbol: row.ticker_symbol,
        transactionDate: row.transaction_date,
        transactionType: row.transaction_type,
        amountRange: row.amount_range,
        estimatedValue: row.estimated_value,
        quantity: row.quantity,
        filingDate: row.filing_date,
        sourceData: row.source_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find trades by ticker symbol
   */
  static async findByTicker(
    tickerSymbol: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TradeWithTrader[]> {
    return StockTrade.findWithDetails(
      { tickerSymbol },
      limit,
      offset
    );
  }

  /**
   * Find recent trades
   */
  static async findRecent(
    days: number = 30,
    limit: number = 50,
    offset: number = 0
  ): Promise<TradeWithTrader[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return StockTrade.findWithDetails(
      { startDate },
      limit,
      offset
    );
  }

  /**
   * Get trading statistics for a trader
   */
  static async getTraderStats(
    traderType: TraderType,
    traderId: string,
    days: number = 365
  ): Promise<{
    totalTrades: number;
    totalValue: number;
    buyTrades: number;
    sellTrades: number;
    uniqueStocks: number;
    averageTradeValue: number;
  }> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total_trades,
           SUM(estimated_value) as total_value,
           SUM(CASE WHEN transaction_type = 'buy' THEN 1 ELSE 0 END) as buy_trades,
           SUM(CASE WHEN transaction_type = 'sell' THEN 1 ELSE 0 END) as sell_trades,
           COUNT(DISTINCT ticker_symbol) as unique_stocks,
           AVG(estimated_value) as average_trade_value
         FROM stock_trades 
         WHERE trader_type = $1 AND trader_id = $2
         AND transaction_date >= NOW() - INTERVAL '${days} days'`,
        [traderType, traderId]
      );

      const stats = result.rows[0];
      return {
        totalTrades: parseInt(stats.total_trades) || 0,
        totalValue: parseFloat(stats.total_value) || 0,
        buyTrades: parseInt(stats.buy_trades) || 0,
        sellTrades: parseInt(stats.sell_trades) || 0,
        uniqueStocks: parseInt(stats.unique_stocks) || 0,
        averageTradeValue: parseFloat(stats.average_trade_value) || 0
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get trading statistics for a stock
   */
  static async getStockStats(
    tickerSymbol: string,
    days: number = 365
  ): Promise<{
    totalTrades: number;
    totalValue: number;
    buyTrades: number;
    sellTrades: number;
    uniqueTraders: number;
    averageTradeValue: number;
  }> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total_trades,
           SUM(estimated_value) as total_value,
           SUM(CASE WHEN transaction_type = 'buy' THEN 1 ELSE 0 END) as buy_trades,
           SUM(CASE WHEN transaction_type = 'sell' THEN 1 ELSE 0 END) as sell_trades,
           COUNT(DISTINCT CONCAT(trader_type, '-', trader_id)) as unique_traders,
           AVG(estimated_value) as average_trade_value
         FROM stock_trades 
         WHERE ticker_symbol = $1
         AND transaction_date >= NOW() - INTERVAL '${days} days'`,
        [tickerSymbol.toUpperCase()]
      );

      const stats = result.rows[0];
      return {
        totalTrades: parseInt(stats.total_trades) || 0,
        totalValue: parseFloat(stats.total_value) || 0,
        buyTrades: parseInt(stats.buy_trades) || 0,
        sellTrades: parseInt(stats.sell_trades) || 0,
        uniqueTraders: parseInt(stats.unique_traders) || 0,
        averageTradeValue: parseFloat(stats.average_trade_value) || 0
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find large trades above a threshold
   */
  static async findLargeTrades(
    minValue: number,
    days: number = 30,
    limit: number = 50
  ): Promise<TradeWithTrader[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return StockTrade.findWithDetails(
      { minValue, startDate },
      limit,
      0,
      'estimated_value DESC'
    );
  }

  /**
   * Update stock trade
   */
  async update(updates: Partial<CreateStockTradeData>): Promise<void> {
    if (!this.id) {
      throw new Error('Stock trade ID is required to update');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (updates.amountRange !== undefined) {
      fields.push(`amount_range = $${paramCounter++}`);
      values.push(updates.amountRange);
    }

    if (updates.estimatedValue !== undefined) {
      if (updates.estimatedValue < 0) {
        throw new Error('Estimated value cannot be negative');
      }
      fields.push(`estimated_value = $${paramCounter++}`);
      values.push(updates.estimatedValue);
    }

    if (updates.quantity !== undefined) {
      if (updates.quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }
      fields.push(`quantity = $${paramCounter++}`);
      values.push(updates.quantity);
    }

    if (updates.filingDate !== undefined) {
      if (updates.filingDate && updates.filingDate < this.transactionDate) {
        throw new Error('Filing date cannot be before transaction date');
      }
      fields.push(`filing_date = $${paramCounter++}`);
      values.push(updates.filingDate);
    }

    if (updates.sourceData !== undefined) {
      fields.push(`source_data = $${paramCounter++}`);
      values.push(updates.sourceData ? JSON.stringify(updates.sourceData) : null);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(this.id);

    const client = await db.connect();
    try {
      await client.query(
        `UPDATE stock_trades SET ${fields.join(', ')} WHERE id = $${paramCounter}`,
        values
      );

      // Update instance properties
      if (updates.amountRange !== undefined) this.amountRange = updates.amountRange;
      if (updates.estimatedValue !== undefined) this.estimatedValue = updates.estimatedValue;
      if (updates.quantity !== undefined) this.quantity = updates.quantity;
      if (updates.filingDate !== undefined) this.filingDate = updates.filingDate;
      if (updates.sourceData !== undefined) this.sourceData = updates.sourceData;
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Bulk create trades (for data imports)
   */
  static async bulkCreate(trades: CreateStockTradeData[]): Promise<void> {
    if (!trades || trades.length === 0) {
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const trade of trades) {
        // Validate each trade
        if (!trade.traderType || !trade.traderId || !trade.tickerSymbol || 
            !trade.transactionDate || !trade.transactionType) {
          throw new Error('Invalid trade data: missing required fields');
        }

        // Check for duplicates based on trader, ticker, date, and type
        const existing = await client.query(
          `SELECT id FROM stock_trades 
           WHERE trader_type = $1 AND trader_id = $2 AND ticker_symbol = $3 
           AND transaction_date = $4 AND transaction_type = $5`,
          [
            trade.traderType,
            trade.traderId,
            trade.tickerSymbol.toUpperCase(),
            trade.transactionDate,
            trade.transactionType
          ]
        );

        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO stock_trades 
             (trader_type, trader_id, ticker_symbol, transaction_date, transaction_type, 
              amount_range, estimated_value, quantity, filing_date, source_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              trade.traderType,
              trade.traderId,
              trade.tickerSymbol.toUpperCase(),
              trade.transactionDate,
              trade.transactionType,
              trade.amountRange || null,
              trade.estimatedValue || null,
              trade.quantity || null,
              trade.filingDate || null,
              trade.sourceData ? JSON.stringify(trade.sourceData) : null
            ]
          );
        }
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
   * Calculate estimated value from amount range
   */
  static calculateEstimatedValue(amountRange: string): number | null {
    if (!amountRange) {
      return null;
    }

    // Parse ranges like "$1,001 - $15,000" or "$15,001 - $50,000"
    const rangeMatch = amountRange.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
    if (!rangeMatch) {
      return null;
    }

    const min = parseInt(rangeMatch[1].replace(/,/g, ''));
    const max = parseInt(rangeMatch[2].replace(/,/g, ''));

    if (isNaN(min) || isNaN(max)) {
      return null;
    }

    // Return midpoint
    return (min + max) / 2;
  }

  /**
   * Format amount range for display
   */
  getFormattedAmountRange(): string {
    if (this.amountRange) {
      return this.amountRange;
    }
    if (this.estimatedValue) {
      return `$${this.estimatedValue.toLocaleString()}`;
    }
    return 'N/A';
  }

  /**
   * Check if trade is recent (within specified days)
   */
  isRecent(days: number = 30): boolean {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.transactionDate >= cutoffDate;
  }

  /**
   * Delete stock trade
   */
  async delete(): Promise<boolean> {
    if (!this.id) {
      throw new Error('Stock trade ID is required to delete');
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'DELETE FROM stock_trades WHERE id = $1',
        [this.id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Find trades with filters
   */
  static async findWithFilters(
    filters: any = {},
    limit: number = 50,
    offset: number = 0,
    sortBy: string = 'transaction_date',
    sortOrder: string = 'desc'
  ): Promise<{ trades: StockTrade[]; total: number }> {
    const client = await db.connect();
    try {
      // Map camelCase column names to snake_case for SQL
      const columnMap: Record<string, string> = {
        'transactionDate': 'transaction_date',
        'transaction_date': 'transaction_date',
        'filingDate': 'filing_date',
        'filing_date': 'filing_date',
        'estimatedValue': 'estimated_value',
        'estimated_value': 'estimated_value',
        'createdAt': 'created_at',
        'created_at': 'created_at'
      };

      const dbColumnName = columnMap[sortBy] || 'transaction_date';

      // Build WHERE clause from filters
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (filters.traderId) {
        whereConditions.push(`st.trader_id = $${paramCounter++}`);
        queryParams.push(filters.traderId);
      }

      if (filters.traderType) {
        whereConditions.push(`st.trader_type = $${paramCounter++}`);
        queryParams.push(filters.traderType);
      }

      if (filters.tickerSymbol) {
        whereConditions.push(`st.ticker_symbol = $${paramCounter++}`);
        queryParams.push(filters.tickerSymbol.toUpperCase());
      }

      if (filters.transactionType) {
        whereConditions.push(`st.transaction_type = $${paramCounter++}`);
        queryParams.push(filters.transactionType);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Add limit and offset parameters
      queryParams.push(limit);
      const limitParam = `$${paramCounter++}`;
      queryParams.push(offset);
      const offsetParam = `$${paramCounter++}`;

      // Query with JOINs to populate trader and stock data
      const result = await client.query(
        `SELECT
          st.*,
          cm.id as member_id,
          cm.name as member_name,
          cm.position as member_position,
          cm.state_code as member_state_code,
          cm.district as member_district,
          cm.party_affiliation as member_party,
          sk.symbol as stock_symbol,
          sk.company_name as stock_company_name,
          sk.sector as stock_sector,
          sk.industry as stock_industry,
          sk.market_cap as stock_market_cap,
          sk.last_price as stock_last_price,
          sk.last_updated as stock_last_updated
        FROM stock_trades st
        LEFT JOIN congressional_members cm ON st.trader_id = cm.id AND st.trader_type = 'congressional'
        LEFT JOIN stock_tickers sk ON st.ticker_symbol = sk.symbol
        ${whereClause}
        ORDER BY st.${dbColumnName} ${sortOrder.toUpperCase()}
        LIMIT ${limitParam} OFFSET ${offsetParam}`,
        queryParams
      );

      // Count query with same filters
      const countQuery = `SELECT COUNT(*) FROM stock_trades st ${whereClause}`;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset params
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      const trades = result.rows.map(row => {
        const trade = new StockTrade({
          id: row.id,
          traderType: row.trader_type,
          traderId: row.trader_id,
          tickerSymbol: row.ticker_symbol,
          transactionDate: row.transaction_date,
          transactionType: row.transaction_type,
          amountRange: row.amount_range,
          estimatedValue: row.estimated_value,
          quantity: row.quantity,
          filingDate: row.filing_date,
          sourceData: row.source_data,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });

        // Populate trader data if available
        if (row.member_id) {
          (trade as any).trader = {
            id: row.member_id,
            name: row.member_name,
            position: row.member_position,
            stateCode: row.member_state_code,
            district: row.member_district,
            partyAffiliation: row.member_party,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }

        // Populate stock data if available
        if (row.stock_symbol) {
          (trade as any).stock = {
            symbol: row.stock_symbol,
            companyName: row.stock_company_name,
            sector: row.stock_sector,
            industry: row.stock_industry,
            marketCap: row.stock_market_cap,
            lastPrice: row.stock_last_price,
            lastUpdated: row.stock_last_updated,
            createdAt: row.created_at
          };
        }

        return trade;
      });

      return { trades, total };
    } finally {
      client.release();
    }
  }

  /**
   * Calculate summary statistics
   */
  static async calculateSummary(filters: any = {}): Promise<any> {
    // Simplified implementation
    return {
      totalTrades: 0,
      totalValue: 0,
      avgValue: 0,
      buyCount: 0,
      sellCount: 0,
      exchangeCount: 0,
      uniqueTraders: 0,
      uniqueStocks: 0,
      dateRange: {
        earliest: null,
        latest: null
      }
    };
  }

  /**
   * Get top traded stocks
   */
  static async getTopTradedStocks(startDate: Date, limit: number): Promise<any[]> {
    // Simplified implementation
    return [];
  }

  /**
   * Get most active traders
   */
  static async getMostActiveTraders(startDate: Date, limit: number): Promise<any[]> {
    // Simplified implementation
    return [];
  }

  /**
   * Convert to JSON
   */
  toJSON(): StockTradeData {
    const json: any = {
      id: this.id,
      traderType: this.traderType,
      traderId: this.traderId,
      tickerSymbol: this.tickerSymbol,
      transactionDate: this.transactionDate,
      transactionType: this.transactionType,
      amountRange: this.amountRange,
      estimatedValue: this.estimatedValue,
      quantity: this.quantity,
      filingDate: this.filingDate,
      sourceData: this.sourceData,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Include trader and stock if populated
    if ((this as any).trader) {
      json.trader = (this as any).trader;
    }
    if ((this as any).stock) {
      json.stock = (this as any).stock;
    }

    return json;
  }
}