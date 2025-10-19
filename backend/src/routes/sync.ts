import { Router, Request, Response } from 'express';
import { runDailySync } from '../jobs/dailySync';

const router = Router();

/**
 * @route POST /api/v1/sync/now
 * @description Trigger manual data sync from FMP API
 * @access Public (should be protected in production)
 */
router.post('/now', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Manual sync triggered via API...');

    // Run sync in background
    runDailySync()
      .then(() => {
        console.log('✅ Manual sync completed successfully');
      })
      .catch((error) => {
        console.error('❌ Manual sync failed:', error);
      });

    // Return immediate response
    res.status(202).json({
      success: true,
      message: 'Data sync started in background. Check server logs for progress.'
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start data sync'
    });
  }
});

export default router;
