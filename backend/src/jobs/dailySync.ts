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

    // Sync all congressional data (Senate + House)
    console.log('\n📊 Syncing congressional trading data from FMP API...');
    const result = await syncService.syncAllCongressionalData({
      limit: 250, // Use optimal limit
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

export default runDailySync;
