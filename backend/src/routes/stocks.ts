import { Router } from 'express';
import { StockController } from '../controllers/StockController';

const router = Router();
const stockController = new StockController();

/**
 * @route GET /api/v1/stocks
 * @description Get list of stock tickers
 * @access Public
 */
router.get('/', stockController.getStocks.bind(stockController));

/**
 * @route GET /api/v1/stocks/:symbol
 * @description Get stock ticker by symbol
 * @access Public
 */
router.get('/:symbol', stockController.getStockBySymbol.bind(stockController));

/**
 * @route GET /api/v1/stocks/:symbol/trades
 * @description Get trades for a specific stock
 * @access Public
 */
router.get('/:symbol/trades', stockController.getStockTrades.bind(stockController));

export default router;
