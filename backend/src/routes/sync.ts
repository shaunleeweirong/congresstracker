import { Router, Request, Response } from 'express';
import { runDailySync, runHistoricalBackfill } from '../jobs/dailySync';

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

/**
 * @route POST /api/v1/sync/backfill
 * @description Trigger historical backfill to fetch ALL data from September 2012
 * @access Public (should be protected in production)
 * @warning This should only be run ONCE during initial setup
 */
router.post('/backfill', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Historical backfill triggered via API...');
    console.log('⚠️  This will fetch ~40,055 trades from September 2012 - Present');

    // Run backfill in background
    runHistoricalBackfill()
      .then(() => {
        console.log('✅ Historical backfill completed successfully');
      })
      .catch((error) => {
        console.error('❌ Historical backfill failed:', error);
      });

    // Return immediate response
    res.status(202).json({
      success: true,
      message: 'Historical backfill started in background. This will take 2-3 minutes.',
      expectedRecords: '~40,055 trades',
      dataCoverage: 'September 2012 - Present',
      estimatedDuration: '2-3 minutes',
      storageRequired: '~20-25 MB',
      note: 'Check server logs for detailed progress. This should only be run once during initial setup.'
    });
  } catch (error) {
    console.error('Error starting historical backfill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start historical backfill'
    });
  }
});

export default router;
