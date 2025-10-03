import { Router } from 'express';
import { authRoutes } from './auth';
import { searchRoutes } from './search';
import { tradeRoutes } from './trades';
import { alertRoutes } from './alerts';
import { followRoutes } from './follows';
import { analyticsRoutes } from './analytics';
import { dashboardRoutes } from './dashboard';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/search', searchRoutes);
router.use('/trades', tradeRoutes);
router.use('/alerts', alertRoutes);
router.use('/follows', followRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'Congressional Trading Transparency Platform API',
    version: '1.0.0',
    description: 'API for tracking congressional and corporate insider trading data',
    endpoints: {
      auth: '/api/v1/auth',
      search: '/api/v1/search',
      trades: '/api/v1/trades',
      alerts: '/api/v1/alerts',
      follows: '/api/v1/follows',
      analytics: '/api/v1/analytics',
      dashboard: '/api/v1/dashboard'
    },
    documentation: '/api/v1/docs'
  });
});

export default router;