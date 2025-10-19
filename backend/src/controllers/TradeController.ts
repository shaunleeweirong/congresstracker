import { Request, Response } from 'express';
import { TradeService, TradeFilters, PaginationOptions } from '../services/TradeService';

export class TradeController {
  /**
   * Get trades with filtering and pagination
   */
  static async getTrades(req: Request, res: Response): Promise<void> {
    try {
      const {
        traderId,
        traderType,
        tickerSymbol,
        transactionType,
        startDate,
        endDate,
        minValue,
        maxValue,
        hasFilingDate,
        sectors,
        states,
        parties,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query;

      // Build filters
      const filters: TradeFilters = {};
      
      if (traderId) filters.traderId = traderId as string;
      if (traderType) {
        if (!['congressional', 'corporate'].includes(traderType as string)) {
          res.status(400).json({
            success: false,
            error: 'traderType must be "congressional" or "corporate"'
          });
          return;
        }
        filters.traderType = traderType as 'congressional' | 'corporate';
      }
      if (tickerSymbol) filters.tickerSymbol = (tickerSymbol as string).toUpperCase();
      if (transactionType) {
        if (!['buy', 'sell', 'exchange'].includes(transactionType as string)) {
          res.status(400).json({
            success: false,
            error: 'transactionType must be "buy", "sell", or "exchange"'
          });
          return;
        }
        filters.transactionType = transactionType as 'buy' | 'sell' | 'exchange';
      }

      // Date filters
      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          res.status(400).json({
            success: false,
            error: 'startDate must be a valid date'
          });
          return;
        }
        filters.startDate = start;
      }

      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'endDate must be a valid date'
          });
          return;
        }
        filters.endDate = end;
      }

      // Value filters
      if (minValue) {
        const min = parseFloat(minValue as string);
        if (isNaN(min) || min < 0) {
          res.status(400).json({
            success: false,
            error: 'minValue must be a non-negative number'
          });
          return;
        }
        filters.minValue = min;
      }

      if (maxValue) {
        const max = parseFloat(maxValue as string);
        if (isNaN(max) || max < 0) {
          res.status(400).json({
            success: false,
            error: 'maxValue must be a non-negative number'
          });
          return;
        }
        filters.maxValue = max;
      }

      // Boolean filter
      if (hasFilingDate !== undefined) {
        filters.hasFilingDate = hasFilingDate === 'true';
      }

      // Array filters
      if (sectors) {
        if (typeof sectors === 'string') {
          filters.sectors = [sectors];
        } else if (Array.isArray(sectors)) {
          filters.sectors = sectors as string[];
        }
      }

      if (states) {
        if (typeof states === 'string') {
          filters.states = [states];
        } else if (Array.isArray(states)) {
          filters.states = states as string[];
        }
      }

      if (parties) {
        if (typeof parties === 'string') {
          filters.parties = [parties];
        } else if (Array.isArray(parties)) {
          filters.parties = parties as string[];
        }
      }

      // Validate date range
      if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate cannot be after endDate'
        });
        return;
      }

      // Validate value range
      if (filters.minValue && filters.maxValue && filters.minValue > filters.maxValue) {
        res.status(400).json({
          success: false,
          error: 'minValue cannot be greater than maxValue'
        });
        return;
      }

      // Build pagination options
      const pagination: PaginationOptions = {};
      
      if (limit) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 1000'
          });
          return;
        }
        pagination.limit = limitNum;
      }

      if (offset) {
        const offsetNum = parseInt(offset as string);
        if (isNaN(offsetNum) || offsetNum < 0) {
          res.status(400).json({
            success: false,
            error: 'offset must be non-negative'
          });
          return;
        }
        pagination.offset = offsetNum;
      }

      if (sortBy) {
        if (!['transactionDate', 'filingDate', 'estimatedValue', 'createdAt'].includes(sortBy as string)) {
          res.status(400).json({
            success: false,
            error: 'sortBy must be "transactionDate", "filingDate", "estimatedValue", or "createdAt"'
          });
          return;
        }
        pagination.sortBy = sortBy as 'transactionDate' | 'filingDate' | 'estimatedValue' | 'createdAt';
      }

      if (sortOrder) {
        if (!['asc', 'desc'].includes(sortOrder as string)) {
          res.status(400).json({
            success: false,
            error: 'sortOrder must be "asc" or "desc"'
          });
          return;
        }
        pagination.sortOrder = sortOrder as 'asc' | 'desc';
      }

      const result = await TradeService.getTrades(filters, pagination);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get trades controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trades fetch'
      });
    }
  }

  /**
   * Get trades for a specific trader
   */
  static async getTraderTrades(req: Request, res: Response): Promise<void> {
    try {
      const { traderId } = req.params;
      const { limit, offset, sortBy, sortOrder } = req.query;

      if (!traderId) {
        res.status(400).json({
          success: false,
          error: 'traderId is required'
        });
        return;
      }

      const pagination: PaginationOptions = {};
      
      if (limit) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 1000'
          });
          return;
        }
        pagination.limit = limitNum;
      }

      if (offset) {
        const offsetNum = parseInt(offset as string);
        if (isNaN(offsetNum) || offsetNum < 0) {
          res.status(400).json({
            success: false,
            error: 'offset must be non-negative'
          });
          return;
        }
        pagination.offset = offsetNum;
      }

      if (sortBy && !['transactionDate', 'filingDate', 'estimatedValue', 'createdAt'].includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          error: 'sortBy must be "transactionDate", "filingDate", "estimatedValue", or "createdAt"'
        });
        return;
      }

      if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
        res.status(400).json({
          success: false,
          error: 'sortOrder must be "asc" or "desc"'
        });
        return;
      }

      if (sortBy) pagination.sortBy = sortBy as any;
      if (sortOrder) pagination.sortOrder = sortOrder as any;

      const result = await TradeService.getTraderTrades(traderId, {}, pagination);

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Trader not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get trader trades controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trader trades fetch'
      });
    }
  }

  /**
   * Get trades for a specific stock
   */
  static async getStockTrades(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const { limit, offset, sortBy, sortOrder } = req.query;

      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'symbol is required'
        });
        return;
      }

      const pagination: PaginationOptions = {};
      
      if (limit) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 1000'
          });
          return;
        }
        pagination.limit = limitNum;
      }

      if (offset) {
        const offsetNum = parseInt(offset as string);
        if (isNaN(offsetNum) || offsetNum < 0) {
          res.status(400).json({
            success: false,
            error: 'offset must be non-negative'
          });
          return;
        }
        pagination.offset = offsetNum;
      }

      if (sortBy && !['transactionDate', 'filingDate', 'estimatedValue', 'createdAt'].includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          error: 'sortBy must be "transactionDate", "filingDate", "estimatedValue", or "createdAt"'
        });
        return;
      }

      if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
        res.status(400).json({
          success: false,
          error: 'sortOrder must be "asc" or "desc"'
        });
        return;
      }

      if (sortBy) pagination.sortBy = sortBy as any;
      if (sortOrder) pagination.sortOrder = sortOrder as any;

      const result = await TradeService.getStockTrades(symbol.toUpperCase(), {}, pagination);

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Stock not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get stock trades controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during stock trades fetch'
      });
    }
  }

  /**
   * Get top traded stocks
   */
  static async getTopTradedStocks(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe, startDate, endDate, limit } = req.query;

      let startDateValue: Date;

      // Accept either startDate+endDate OR timeframe
      if (startDate && endDate) {
        // Use provided date range
        startDateValue = new Date(startDate as string);
        const endDateValue = new Date(endDate as string);

        if (isNaN(startDateValue.getTime()) || isNaN(endDateValue.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format. Use ISO 8601 format (e.g., 2025-09-01T00:00:00.000Z)'
          });
          return;
        }

        if (startDateValue > endDateValue) {
          res.status(400).json({
            success: false,
            error: 'startDate must be before endDate'
          });
          return;
        }
      } else {
        // Fall back to timeframe
        const validTimeframes = ['day', 'week', 'month', 'quarter', 'year'];
        const tf = (timeframe as string) || 'month';

        if (!validTimeframes.includes(tf)) {
          res.status(400).json({
            success: false,
            error: 'timeframe must be "day", "week", "month", "quarter", or "year"'
          });
          return;
        }

        // Convert timeframe to startDate
        startDateValue = TradeService.getTimeframeStartDate(tf as any);
      }

      let limitNum = 20;
      if (limit) {
        limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 100'
          });
          return;
        }
      }

      const result = await TradeService.getTopTradedStocks(startDateValue, limitNum);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get top traded stocks controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during top traded stocks fetch'
      });
    }
  }

  /**
   * Get most active traders
   */
  static async getMostActiveTraders(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe, startDate, endDate, limit } = req.query;

      let startDateValue: Date;

      // Accept either startDate+endDate OR timeframe
      if (startDate && endDate) {
        // Use provided date range
        startDateValue = new Date(startDate as string);
        const endDateValue = new Date(endDate as string);

        if (isNaN(startDateValue.getTime()) || isNaN(endDateValue.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format. Use ISO 8601 format (e.g., 2025-09-01T00:00:00.000Z)'
          });
          return;
        }

        if (startDateValue > endDateValue) {
          res.status(400).json({
            success: false,
            error: 'startDate must be before endDate'
          });
          return;
        }
      } else {
        // Fall back to timeframe
        const validTimeframes = ['day', 'week', 'month', 'quarter', 'year'];
        const tf = (timeframe as string) || 'month';

        if (!validTimeframes.includes(tf)) {
          res.status(400).json({
            success: false,
            error: 'timeframe must be "day", "week", "month", "quarter", or "year"'
          });
          return;
        }

        // Convert timeframe to startDate
        startDateValue = TradeService.getTimeframeStartDate(tf as any);
      }

      let limitNum = 20;
      if (limit) {
        limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 100'
          });
          return;
        }
      }

      const result = await TradeService.getMostActiveTraders(startDateValue, limitNum);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get most active traders controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during most active traders fetch'
      });
    }
  }

  /**
   * Get trade by ID
   */
  static async getTradeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Trade ID is required'
        });
        return;
      }

      // For now, get trades and filter by ID
      const trades = await TradeService.getTrades({}, { limit: 1000 });
      const trade = trades.trades.find((t: any) => t.id === id);

      if (!trade) {
        res.status(404).json({
          success: false,
          error: 'Trade not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: trade
      });
    } catch (error) {
      console.error('Get trade by ID controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trade fetch'
      });
    }
  }

  /**
   * Get trade statistics summary
   */
  static async getTradeStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe } = req.query;

      const validTimeframes = ['day', 'week', 'month', 'quarter', 'year', 'all'];
      const tf = (timeframe as string) || 'month';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "day", "week", "month", "quarter", "year", or "all"'
        });
        return;
      }

      const statistics = await TradeService.getTradeStatistics(tf as any);

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get trade statistics controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trade statistics fetch'
      });
    }
  }
}

export default TradeController;