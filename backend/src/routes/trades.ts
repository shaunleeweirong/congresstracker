import { Router } from 'express';
import { TradeController } from '../controllers/TradeController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// Most trade routes are public (read-only access to trading data)
// But we apply optional authentication for usage tracking

router.get('/', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getTrades
);

router.get('/recent', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getTrades // Same endpoint, different default sorting
);

router.get('/top-stocks', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getTopTradedStocks
);

router.get('/active-traders', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getMostActiveTraders
);

router.get('/statistics', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getTradeStatistics
);

router.get('/:id', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getTradeById
);

router.get('/trader/:traderId', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getTraderTrades
);

router.get('/stock/:symbol', 
  rateLimiters.data,
  optionalAuthenticate,
  TradeController.getStockTrades
);

export { router as tradeRoutes };