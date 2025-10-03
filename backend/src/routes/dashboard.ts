import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const dashboardController = new DashboardController();

// Rate limiting for dashboard endpoints
// More generous limits since these are read-only cached endpoints
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: 'Too many requests to dashboard endpoints, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all dashboard routes
router.use(dashboardLimiter);

/**
 * @route GET /api/v1/dashboard/metrics
 * @desc Get dashboard metrics (cached)
 * @access Public
 */
router.get(
  '/metrics',
  dashboardController.getMetrics.bind(dashboardController)
);

/**
 * @route GET /api/v1/dashboard/metrics/detailed
 * @desc Get detailed dashboard metrics with breakdown
 * @access Public
 */
router.get(
  '/metrics/detailed',
  dashboardController.getMetricsDetailed.bind(dashboardController)
);

/**
 * @route GET /api/v1/dashboard/cache/status
 * @desc Get cache status for dashboard metrics
 * @access Public
 */
router.get(
  '/cache/status',
  dashboardController.getCacheStatus.bind(dashboardController)
);

/**
 * @route POST /api/v1/dashboard/cache/invalidate
 * @desc Invalidate dashboard metrics cache
 * @access Internal/Admin (should be protected in production)
 */
router.post(
  '/cache/invalidate',
  // TODO: Add authentication middleware for production
  dashboardController.invalidateCache.bind(dashboardController)
);

export { router as dashboardRoutes };
export default router;
