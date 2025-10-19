import { Request, Response } from 'express';
import { StockTicker } from '../models/StockTicker';
import { StockTrade } from '../models/StockTrade';

export class StockController {
  /**
   * Get list of stock tickers
   */
  async getStocks(req: Request, res: Response): Promise<void> {
    try {
      const {
        sector,
        limit = 50,
        offset = 0
      } = req.query;

      const filters: any = {};
      if (sector) filters.sector = sector;

      const stocks = await StockTicker.findAll(
        filters,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      // Get total count
      const totalResult = await StockTicker.count(filters);

      res.json({
        success: true,
        data: {
          stocks,
          total: totalResult,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + stocks.length < totalResult
        }
      });
    } catch (error) {
      console.error('Error fetching stocks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stock tickers'
      });
    }
  }

  /**
   * Get stock ticker by symbol
   */
  async getStockBySymbol(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;

      const stock = await StockTicker.findBySymbol(symbol.toUpperCase());

      if (!stock) {
        res.status(404).json({
          success: false,
          error: 'Stock ticker not found'
        });
        return;
      }

      res.json({
        success: true,
        data: stock
      });
    } catch (error) {
      console.error('Error fetching stock:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stock ticker'
      });
    }
  }

  /**
   * Get trades for a specific stock
   */
  async getStockTrades(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const {
        limit = 20,
        offset = 0,
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = req.query;

      // Verify stock exists
      const stock = await StockTicker.findBySymbol(symbol.toUpperCase());
      if (!stock) {
        res.status(404).json({
          success: false,
          error: 'Stock ticker not found'
        });
        return;
      }

      // Fetch trades for this stock
      const { trades, total } = await StockTrade.findWithFilters(
        { tickerSymbol: symbol.toUpperCase() },
        parseInt(limit as string),
        parseInt(offset as string),
        sortBy as string,
        sortOrder as string
      );

      res.json({
        success: true,
        data: {
          stock,
          trades,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + trades.length < total
        }
      });
    } catch (error) {
      console.error('Error fetching stock trades:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stock trades'
      });
    }
  }
}
