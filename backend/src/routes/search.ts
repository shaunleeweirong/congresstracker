import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { optionalAuthenticate } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// All search routes are public but we apply optional authentication
// to track usage and provide personalized results for authenticated users

router.get('/', 
  rateLimiters.search,
  optionalAuthenticate,
  SearchController.searchAll
);

router.get('/politicians', 
  rateLimiters.search,
  optionalAuthenticate,
  SearchController.searchPoliticians
);

router.get('/stocks', 
  rateLimiters.search,
  optionalAuthenticate,
  SearchController.searchStocks
);

router.get('/suggestions', 
  rateLimiters.search,
  optionalAuthenticate,
  SearchController.getSuggestions
);

router.get('/popular', 
  rateLimiters.search,
  optionalAuthenticate,
  SearchController.getPopularSearches
);

router.get('/filters', 
  rateLimiters.public,
  SearchController.getSearchFilters
);

export { router as searchRoutes };