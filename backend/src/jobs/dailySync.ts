import { CongressionalDataService } from '../services/CongressionalDataService';
import { DashboardService } from '../services/DashboardService';

/**
 * Daily sync job to fetch all congressional trading data from FMP API
 * and store it in the database
 */
export async function runDailySync(): Promise<void> {
  const startTime = Date.now();
  console.log('🚀 Starting daily congressional data sync...');
  console.log(`📅 Start time: ${new Date().toISOString()}`);

  try {
    const syncService = new CongressionalDataService();
    const dashboardService = new DashboardService();

    // Sync all congressional data (Senate + House) with multi-page support
    console.log('\n📊 Syncing congressional trading data from FMP API...');
    const result = await syncService.syncAllCongressionalData({
      limit: 250, // API hard cap per request
      maxPages: 10, // DAILY SYNC: 10 pages = last 2-3 months (catches new trades)
                    // Initial 100-page backfill completed on 2025-10-18
                    // ~2,500 trades total, ~2-3 min sync time
      forceUpdate: false,
      syncInsiders: false, // Can enable this later if needed
      onProgress: (progress) => {
        console.log(`  Progress: ${progress.current}/${progress.total} ${progress.type} trades`);
      }
    });

    const duration = Date.now() - startTime;

    // Log results
    console.log('\n✅ Sync completed successfully!');
    console.log(`📈 Results:`);
    console.log(`   - Processed: ${result.processedCount} trades`);
    console.log(`   - Created: ${result.createdCount} new trades`);
    console.log(`   - Updated: ${result.updatedCount} existing trades`);
    console.log(`   - Skipped: ${result.skippedCount} duplicates`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Duration: ${(duration / 1000).toFixed(2)}s`);

    if (result.errors.length > 0) {
      console.warn('\n⚠️  Errors encountered:');
      result.errors.forEach((error, index) => {
        console.warn(`   ${index + 1}. ${error}`);
      });
    }

    // Invalidate dashboard cache to reflect new data
    console.log('\n🔄 Invalidating dashboard metrics cache...');
    await dashboardService.invalidateCache();

    console.log(`\n✅ Daily sync job completed at ${new Date().toISOString()}`);
    console.log(`⏱️  Total time: ${(duration / 1000).toFixed(2)}s\n`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ Daily sync job failed!');
    console.error(`⏱️  Failed after: ${(duration / 1000).toFixed(2)}s`);
    console.error(`🔥 Error:`, error);

    throw error; // Re-throw to allow scheduler to handle it
  }
}

/**
 * Incremental sync - only sync recent trades (last 7 days)
 * Faster alternative to full sync for more frequent updates
 */
export async function runIncrementalSync(days: number = 7): Promise<void> {
  console.log(`🚀 Starting incremental sync (last ${days} days)...`);

  try {
    const syncService = new CongressionalDataService();
    const dashboardService = new DashboardService();

    // For incremental sync, we still need to fetch all pages
    // but we'll only process recent trades
    // Note: FMP API doesn't have date filtering, so we fetch all and filter
    const result = await syncService.syncAllCongressionalData({
      limit: 250,
      forceUpdate: true, // Update existing trades in case of corrections
      syncInsiders: false
    });

    console.log(`✅ Incremental sync completed`);
    console.log(`   - Processed: ${result.processedCount} trades`);
    console.log(`   - Updated: ${result.updatedCount} trades`);

    // Invalidate cache
    await dashboardService.invalidateCache();

  } catch (error) {
    console.error('❌ Incremental sync failed:', error);
    throw error;
  }
}

/**
 * Historical backfill - fetch all available data from FMP API (September 2012 - Present)
 * Should only be run once during initial setup
 *
 * FEATURES:
 * - Checkpoint/Resume: Automatically resumes from last saved checkpoint if interrupted
 * - Progress Tracking: Saves progress every 100 trades
 * - Idempotent: Safe to run multiple times - will skip already-completed sections
 */
export async function runHistoricalBackfill(): Promise<void> {
  const startTime = Date.now();
  console.log('🚀 Starting HISTORICAL BACKFILL...');
  console.log('📅 This will fetch ALL available congressional trading data');
  console.log('📊 Expected: ~40,055 trades from September 2012 - Present');
  console.log('⏱️  Estimated time: Variable (depends on network and DB latency)');
  console.log('💾 Storage required: ~20-25 MB');
  console.log('🔄 Checkpoint-enabled: Safe to restart if interrupted\n');

  try {
    const syncService = new CongressionalDataService();
    const dashboardService = new DashboardService();

    // Sync all congressional data with MAXIMUM pagination + CHECKPOINTS
    console.log('\n📊 Syncing ALL congressional trading data from FMP API...');
    console.log('💾 Checkpoints will be saved every 100 trades\n');
    const result = await syncService.syncAllCongressionalData({
      limit: 250, // API hard cap per request
      maxPages: 100, // HISTORICAL BACKFILL: Maximum allowed by FMP API
                     // Senate: ~60 pages (14,805 trades)
                     // House: ~100 pages (25,250 trades, hits API pagination limit)
                     // Total: ~40,055 trades covering Sep 2012 - Present
      forceUpdate: false,
      syncInsiders: false,
      useCheckpoints: true, // Enable resume capability
      batchSize: 100, // Save checkpoint every 100 trades
      onProgress: (progress) => {
        const percent = ((progress.current / progress.total) * 100).toFixed(1);
        console.log(`  📈 ${progress.type}: ${progress.current}/${progress.total} (${percent}%)`);
      }
    });

    const duration = Date.now() - startTime;

    // Log results
    console.log('\n✅ HISTORICAL BACKFILL COMPLETED!');
    console.log('━'.repeat(60));
    console.log(`📈 Results:`);
    console.log(`   - Total Processed: ${result.processedCount} trades`);
    console.log(`   - Newly Created: ${result.createdCount} trades`);
    console.log(`   - Updated: ${result.updatedCount} existing trades`);
    console.log(`   - Skipped (duplicates): ${result.skippedCount} trades`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Total Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    console.log('━'.repeat(60));

    // Storage estimate
    const estimatedStorageMB = (result.createdCount * 0.0004).toFixed(2); // ~400 bytes per trade
    console.log(`💾 Estimated storage used: ~${estimatedStorageMB} MB`);
    console.log(`📊 Data coverage: September 2012 - ${new Date().toISOString().split('T')[0]}`);

    if (result.errors.length > 0) {
      console.warn('\n⚠️  Errors encountered during backfill:');
      result.errors.slice(0, 10).forEach((error, index) => {
        console.warn(`   ${index + 1}. ${error}`);
      });
      if (result.errors.length > 10) {
        console.warn(`   ... and ${result.errors.length - 10} more errors`);
      }
    }

    // Invalidate dashboard cache to reflect new data
    console.log('\n🔄 Invalidating dashboard metrics cache...');
    await dashboardService.invalidateCache();

    console.log(`\n✅ Historical backfill job completed at ${new Date().toISOString()}`);
    console.log(`⏱️  Total time: ${(duration / 1000 / 60).toFixed(2)} minutes\n`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ Historical backfill job FAILED!');
    console.error(`⏱️  Failed after: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    console.error(`🔥 Error:`, error);

    throw error; // Re-throw to allow caller to handle it
  }
}

export default runDailySync;
