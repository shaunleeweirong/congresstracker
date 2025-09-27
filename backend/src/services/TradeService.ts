import { StockTrade } from '../models/StockTrade';
import { CongressionalMember } from '../models/CongressionalMember';
import { StockTicker } from '../models/StockTicker';

export interface TradeFilters {
  traderId?: string;
  traderType?: 'congressional' | 'corporate';
  tickerSymbol?: string;
  transactionType?: 'buy' | 'sell' | 'exchange';
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
  hasFilingDate?: boolean;
  sectors?: string[];
  states?: string[];
  parties?: string[];
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'transactionDate' | 'filingDate' | 'estimatedValue' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TradeQueryResult {
  trades: StockTrade[];
  total: number;
  hasMore: boolean;
  summary: TradeSummary;
}

export interface TradeSummary {
  totalTrades: number;
  totalValue: number;
  avgValue: number;
  buyCount: number;
  sellCount: number;
  exchangeCount: number;
  uniqueTraders: number;
  uniqueStocks: number;
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
}

export interface TraderTradeHistory {
  trader: CongressionalMember;
  trades: StockTrade[];
  total: number;
  summary: TradeSummary;
}

export interface StockTradeHistory {
  stock: StockTicker;
  trades: StockTrade[];
  total: number;
  summary: TradeSummary;
}

export class TradeService {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 500;
  private static readonly DEFAULT_SORT = 'transactionDate';
  private static readonly DEFAULT_ORDER = 'desc';

  /**
   * Get trades with filtering and pagination
   */
  static async getTrades(
    filters: TradeFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<TradeQueryResult> {
    const {
      limit = this.DEFAULT_LIMIT,
      offset = 0,
      sortBy = this.DEFAULT_SORT,
      sortOrder = this.DEFAULT_ORDER
    } = pagination;

    // Validate inputs
    const validatedLimit = Math.min(limit, this.MAX_LIMIT);
    const validatedOffset = Math.max(offset, 0);

    try {
      // Get trades and total count
      const { trades, total } = await StockTrade.findWithFilters(
        filters,
        validatedLimit,
        validatedOffset,
        sortBy,
        sortOrder
      );

      // Calculate summary statistics
      const summary = await this.calculateTradeSummary(filters);

      return {
        trades,
        total,
        hasMore: total > validatedOffset + trades.length,
        summary
      };
    } catch (error) {
      console.error('Get trades error:', error);
      return {
        trades: [],
        total: 0,
        hasMore: false,
        summary: this.getEmptySummary()
      };
    }
  }

  /**
   * Get recent trades (last 30 days)
   */
  static async getRecentTrades(
    pagination: PaginationOptions = {}
  ): Promise<TradeQueryResult> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.getTrades(
      { startDate: thirtyDaysAgo },
      pagination
    );
  }

  /**
   * Get trades for a specific politician
   */
  static async getTraderTrades(
    traderId: string,
    filters: Omit<TradeFilters, 'traderId'> = {},
    pagination: PaginationOptions = {}
  ): Promise<TraderTradeHistory> {
    try {
      // Get trader information
      const trader = await CongressionalMember.findById(traderId);
      if (!trader) {
        throw new Error('Trader not found');
      }

      // Get trades for this trader
      const tradeResult = await this.getTrades(
        { ...filters, traderId, traderType: 'congressional' },
        pagination
      );

      return {
        trader,
        trades: tradeResult.trades,
        total: tradeResult.total,
        summary: tradeResult.summary
      };
    } catch (error) {
      console.error('Get trader trades error:', error);
      throw error;
    }
  }

  /**
   * Get trades for a specific stock
   */
  static async getStockTrades(
    tickerSymbol: string,
    filters: Omit<TradeFilters, 'tickerSymbol'> = {},
    pagination: PaginationOptions = {}
  ): Promise<StockTradeHistory> {
    try {
      // Get stock information
      const stock = await StockTicker.findBySymbol(tickerSymbol);
      if (!stock) {
        throw new Error('Stock not found');
      }

      // Get trades for this stock
      const tradeResult = await this.getTrades(
        { ...filters, tickerSymbol },
        pagination
      );

      return {
        stock,
        trades: tradeResult.trades,
        total: tradeResult.total,
        summary: tradeResult.summary
      };
    } catch (error) {
      console.error('Get stock trades error:', error);
      throw error;
    }
  }

  /**
   * Get top traded stocks by volume
   */
  static async getTopTradedStocks(
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
    limit: number = 20
  ): Promise<Array<{ stock: StockTicker; tradeCount: number; totalValue: number }>> {
    try {
      const validatedLimit = Math.min(limit, 100);
      const startDate = this.getTimeframeStartDate(timeframe);

      return await StockTrade.getTopTradedStocks(startDate, validatedLimit);
    } catch (error) {
      console.error('Get top traded stocks error:', error);
      return [];
    }
  }

  /**
   * Get most active traders by volume
   */
  static async getMostActiveTraders(
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
    limit: number = 20
  ): Promise<Array<{ trader: CongressionalMember; tradeCount: number; totalValue: number }>> {
    try {
      const validatedLimit = Math.min(limit, 100);
      const startDate = this.getTimeframeStartDate(timeframe);

      return await StockTrade.getMostActiveTraders(startDate, validatedLimit);
    } catch (error) {
      console.error('Get most active traders error:', error);
      return [];
    }
  }

  /**
   * Get trade statistics by timeframe
   */
  static async getTradeStatistics(
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
    filters: TradeFilters = {}
  ): Promise<{
    period: string;
    totalTrades: number;
    totalValue: number;
    avgTradeValue: number;
    buyPercentage: number;
    sellPercentage: number;
    uniqueTraders: number;
    uniqueStocks: number;
  }> {
    try {
      const startDate = this.getTimeframeStartDate(timeframe);
      const endDate = new Date();

      const filtersWithDate = {
        ...filters,
        startDate,
        endDate
      };

      const summary = await this.calculateTradeSummary(filtersWithDate);

      return {
        period: timeframe,
        totalTrades: summary.totalTrades,
        totalValue: summary.totalValue,
        avgTradeValue: summary.avgValue,
        buyPercentage: summary.totalTrades > 0 ? (summary.buyCount / summary.totalTrades) * 100 : 0,
        sellPercentage: summary.totalTrades > 0 ? (summary.sellCount / summary.totalTrades) * 100 : 0,
        uniqueTraders: summary.uniqueTraders,
        uniqueStocks: summary.uniqueStocks
      };
    } catch (error) {
      console.error('Get trade statistics error:', error);
      return {
        period: timeframe,
        totalTrades: 0,
        totalValue: 0,
        avgTradeValue: 0,
        buyPercentage: 0,
        sellPercentage: 0,
        uniqueTraders: 0,
        uniqueStocks: 0
      };
    }
  }

  /**
   * Create a new trade record
   */
  static async createTrade(tradeData: any): Promise<StockTrade | null> {
    try {
      // Validate required fields
      const validation = this.validateTradeData(tradeData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check if trader exists
      if (tradeData.traderType === 'congressional') {
        const trader = await CongressionalMember.findById(tradeData.traderId);
        if (!trader) {
          throw new Error('Congressional member not found');
        }
      }

      // Check if stock exists
      const stock = await StockTicker.findBySymbol(tradeData.tickerSymbol);
      if (!stock) {
        throw new Error('Stock ticker not found');
      }

      // Create trade
      return await StockTrade.create(tradeData);
    } catch (error) {
      console.error('Create trade error:', error);
      throw error;
    }
  }

  /**
   * Update trade record
   */
  static async updateTrade(tradeId: string, updateData: any): Promise<StockTrade | null> {
    try {
      const trade = await StockTrade.findById(tradeId);
      if (!trade) {
        throw new Error('Trade not found');
      }

      // Validate update data
      const validation = this.validateTradeUpdateData(updateData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      return await trade.update(updateData);
    } catch (error) {
      console.error('Update trade error:', error);
      throw error;
    }
  }

  /**
   * Delete trade record
   */
  static async deleteTrade(tradeId: string): Promise<boolean> {
    try {
      const trade = await StockTrade.findById(tradeId);
      if (!trade) {
        throw new Error('Trade not found');
      }

      return await trade.delete();
    } catch (error) {
      console.error('Delete trade error:', error);
      throw error;
    }
  }

  /**
   * Get trades that match similar patterns
   */
  static async findSimilarTrades(
    referenceTradeId: string,
    limit: number = 10
  ): Promise<StockTrade[]> {
    try {
      const referenceTrade = await StockTrade.findById(referenceTradeId);
      if (!referenceTrade) {
        throw new Error('Reference trade not found');
      }

      // Find trades with similar characteristics
      const filters: TradeFilters = {
        traderId: referenceTrade.traderId,
        tickerSymbol: referenceTrade.tickerSymbol,
        transactionType: referenceTrade.transactionType
      };

      const result = await this.getTrades(filters, { limit });
      
      // Remove the reference trade from results
      return result.trades.filter(trade => trade.id !== referenceTradeId);
    } catch (error) {
      console.error('Find similar trades error:', error);
      return [];
    }
  }

  /**
   * Calculate trade summary statistics
   */
  private static async calculateTradeSummary(filters: TradeFilters): Promise<TradeSummary> {
    try {
      return await StockTrade.calculateSummary(filters);
    } catch (error) {
      console.error('Calculate trade summary error:', error);
      return this.getEmptySummary();
    }
  }

  /**
   * Get empty summary object
   */
  private static getEmptySummary(): TradeSummary {
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
   * Get start date for timeframe
   */
  private static getTimeframeStartDate(timeframe: string): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return startDate;
  }

  /**
   * Validate trade data for creation
   */
  private static validateTradeData(data: any): { isValid: boolean; error?: string } {
    if (!data.traderId) {
      return { isValid: false, error: 'Trader ID is required' };
    }

    if (!data.traderType) {
      return { isValid: false, error: 'Trader type is required' };
    }

    if (!['congressional', 'corporate'].includes(data.traderType)) {
      return { isValid: false, error: 'Invalid trader type' };
    }

    if (!data.tickerSymbol) {
      return { isValid: false, error: 'Ticker symbol is required' };
    }

    if (!data.transactionDate) {
      return { isValid: false, error: 'Transaction date is required' };
    }

    if (!data.transactionType) {
      return { isValid: false, error: 'Transaction type is required' };
    }

    if (!['buy', 'sell', 'exchange'].includes(data.transactionType)) {
      return { isValid: false, error: 'Invalid transaction type' };
    }

    if (data.estimatedValue && data.estimatedValue < 0) {
      return { isValid: false, error: 'Estimated value cannot be negative' };
    }

    if (data.quantity && data.quantity < 0) {
      return { isValid: false, error: 'Quantity cannot be negative' };
    }

    return { isValid: true };
  }

  /**
   * Validate trade update data
   */
  private static validateTradeUpdateData(data: any): { isValid: boolean; error?: string } {
    if (data.transactionType && !['buy', 'sell', 'exchange'].includes(data.transactionType)) {
      return { isValid: false, error: 'Invalid transaction type' };
    }

    if (data.estimatedValue && data.estimatedValue < 0) {
      return { isValid: false, error: 'Estimated value cannot be negative' };
    }

    if (data.quantity && data.quantity < 0) {
      return { isValid: false, error: 'Quantity cannot be negative' };
    }

    return { isValid: true };
  }
}

export default TradeService;