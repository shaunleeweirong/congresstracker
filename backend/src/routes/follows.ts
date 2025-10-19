import { Router } from 'express';
import { FollowController } from '../controllers/FollowController';
import { authenticate } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// All follow routes require authentication (billing feature)

router.post('/', 
  authenticate,
  rateLimiters.modify,
  FollowController.createFollow
);

router.get('/', 
  authenticate,
  rateLimiters.follows,
  FollowController.getUserFollows
);

router.get('/summary', 
  authenticate,
  rateLimiters.follows,
  FollowController.getFollowSummary
);

router.get('/billing', 
  authenticate,
  rateLimiters.follows,
  FollowController.calculateBilling
);

router.post('/billing/process', 
  authenticate,
  rateLimiters.modify,
  FollowController.processMonthlyBilling
);

router.get('/popular', 
  rateLimiters.public,
  FollowController.getPopularTraders
);

router.get('/:id', 
  authenticate,
  rateLimiters.follows,
  FollowController.getFollowById
);

router.put('/:id', 
  authenticate,
  rateLimiters.follows,
  FollowController.updateFollow
);

router.delete('/:id', 
  authenticate,
  rateLimiters.modify,
  FollowController.cancelFollow
);

router.get('/:id/analytics', 
  authenticate,
  rateLimiters.follows,
  FollowController.getFollowAnalytics
);

router.get('/status/:traderId', 
  authenticate,
  rateLimiters.follows,
  FollowController.checkFollowStatus
);

export { router as followRoutes };