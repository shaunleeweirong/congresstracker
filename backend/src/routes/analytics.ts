import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// Analytics routes are mostly public but may have enhanced features for authenticated users

router.get('/portfolio/:traderId', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getPortfolioConcentration
);

router.get('/patterns/:traderId', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getTradingPatterns
);

router.get('/market-trends', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getMarketTrends
);

router.get('/compare/:traderAId/:traderBId', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.compareTraders
);

router.get('/benchmarks', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getPerformanceBenchmarks
);

router.get('/rankings', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getTraderRankings
);

router.get('/sectors', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getSectorAnalysis
);

router.get('/correlation', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getCorrelationAnalysis
);

router.get('/risk/:traderId', 
  rateLimiters.data,
  optionalAuthenticate,
  AnalyticsController.getRiskAssessment
);

export { router as analyticsRoutes };