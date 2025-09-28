import { CongressionalDataService, SyncResult, SyncOptions } from '../services/CongressionalDataService';
import { CacheService, getCacheService } from '../services/CacheService';

export interface JobResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  syncResults: {
    congressional: SyncResult;
    insider?: SyncResult;
  };
  errors: string[];
  cacheStats?: {
    cleared: boolean;
    refreshed: boolean;
  };
}

export interface JobOptions {
  syncInsiders?: boolean;
  forceUpdate?: boolean;
  clearCache?: boolean;
  enableProgressLogging?: boolean;
  maxRecords?: number;
}

export class TradingDataSyncJob {
  private congressionalService: CongressionalDataService;
  private cacheService: CacheService;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private lastResult: JobResult | null = null;

  constructor() {
    this.congressionalService = new CongressionalDataService();
    this.cacheService = getCacheService();
  }

  /**
   * Run the daily trading data synchronization
   */
  async run(options: JobOptions = {}): Promise<JobResult> {
    if (this.isRunning) {
      throw new Error('Sync job is already running');
    }

    this.isRunning = true;
    const startTime = new Date();
    const errors: string[] = [];
    let syncResults: JobResult['syncResults'] = {
      congressional: {
        success: false,
        processedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errors: [],
        duration: 0
      }
    };
    let cacheStats: JobResult['cacheStats'] | undefined;

    try {
      console.log('=== Trading Data Sync Job Started ===');
      console.log(`Start time: ${startTime.toISOString()}`);
      console.log(`Options:`, options);

      // Clear cache if requested
      if (options.clearCache) {
        try {
          await this.cacheService.clearAll();
          cacheStats = { cleared: true, refreshed: false };
          console.log('✅ Cache cleared successfully');
        } catch (error) {
          const errorMsg = `Cache clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
          cacheStats = { cleared: false, refreshed: false };
        }
      }

      // Set up sync options
      const syncOptions: SyncOptions = {
        ...(options.maxRecords !== undefined && { limit: options.maxRecords }),
        forceUpdate: options.forceUpdate || false,
        syncInsiders: options.syncInsiders || false,
        ...(options.enableProgressLogging && { onProgress: this.logProgress })
      };

      // Sync congressional data
      console.log('📊 Starting congressional data sync...');
      const congressionalResult = await this.congressionalService.syncAllCongressionalData(syncOptions);
      
      console.log('📊 Congressional sync completed:', {
        success: congressionalResult.success,
        processed: congressionalResult.processedCount,
        created: congressionalResult.createdCount,
        updated: congressionalResult.updatedCount,
        skipped: congressionalResult.skippedCount,
        errors: congressionalResult.errors.length,
        duration: `${congressionalResult.duration}ms`
      });

      if (congressionalResult.errors.length > 0) {
        errors.push(...congressionalResult.errors);
      }

      syncResults = {
        congressional: congressionalResult
      };

      // Sync insider data if requested
      if (options.syncInsiders) {
        console.log('🏢 Starting insider data sync...');
        const insiderResult = await this.congressionalService.syncInsiderTrades(syncOptions);
        
        console.log('🏢 Insider sync completed:', {
          success: insiderResult.success,
          processed: insiderResult.processedCount,
          created: insiderResult.createdCount,
          updated: insiderResult.updatedCount,
          skipped: insiderResult.skippedCount,
          errors: insiderResult.errors.length,
          duration: `${insiderResult.duration}ms`
        });

        if (insiderResult.errors.length > 0) {
          errors.push(...insiderResult.errors);
        }

        syncResults.insider = insiderResult;
      }

      // Refresh cache after successful sync
      if (!options.clearCache && (congressionalResult.success || (syncResults.insider?.success !== false))) {
        try {
          await this.refreshCriticalCache();
          if (cacheStats) {
            cacheStats.refreshed = true;
          } else {
            cacheStats = { cleared: false, refreshed: true };
          }
          console.log('✅ Critical cache refreshed');
        } catch (error) {
          const errorMsg = `Cache refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: JobResult = {
        success: errors.length === 0,
        startTime,
        endTime,
        duration,
        syncResults,
        errors,
        ...(cacheStats ? { cacheStats } : {})
      };

      this.lastRunTime = startTime;
      this.lastResult = result;

      console.log('=== Trading Data Sync Job Completed ===');
      console.log(`End time: ${endTime.toISOString()}`);
      console.log(`Total duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`Success: ${result.success}`);
      console.log(`Total errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log('Errors encountered:');
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Trading Data Sync Job Failed:', errorMsg);
      
      const result: JobResult = {
        success: false,
        startTime,
        endTime,
        duration,
        syncResults,
        errors: [errorMsg, ...errors],
        ...(cacheStats ? { cacheStats } : {})
      };

      this.lastResult = result;
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run a quick test sync with limited data
   */
  async testRun(limit = 5): Promise<JobResult> {
    console.log(`🧪 Running test sync with limit ${limit}...`);
    
    return this.run({
      maxRecords: limit,
      forceUpdate: false,
      syncInsiders: false,
      enableProgressLogging: true,
      clearCache: false
    });
  }

  /**
   * Get the status of the sync job
   */
  getStatus(): {
    isRunning: boolean;
    lastRunTime: Date | null;
    lastResult: JobResult | null;
  } {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastResult: this.lastResult
    };
  }

  /**
   * Schedule the job to run at a specific time daily
   */
  schedule(hour = 6, minute = 0): NodeJS.Timeout {
    const getNextRunTime = (): Date => {
      const now = new Date();
      const nextRun = new Date();
      nextRun.setHours(hour, minute, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      return nextRun;
    };

    const scheduleNext = (): NodeJS.Timeout => {
      const nextRun = getNextRunTime();
      const delay = nextRun.getTime() - Date.now();
      
      console.log(`📅 Next sync scheduled for: ${nextRun.toISOString()}`);
      
      return setTimeout(async () => {
        try {
          await this.run({
            syncInsiders: true,
            forceUpdate: false,
            clearCache: false,
            enableProgressLogging: false
          });
        } catch (error) {
          console.error('❌ Scheduled sync failed:', error);
        }
        
        // Schedule the next run
        scheduleNext();
      }, delay);
    };

    return scheduleNext();
  }

  /**
   * Force stop a running job (use with caution)
   */
  forceStop(): void {
    if (this.isRunning) {
      console.warn('⚠️ Force stopping sync job...');
      this.isRunning = false;
    }
  }

  /**
   * Progress logging callback
   */
  private logProgress = (progress: { current: number; total: number; type: string }): void => {
    const percentage = ((progress.current / progress.total) * 100).toFixed(1);
    console.log(`📈 ${progress.type} progress: ${progress.current}/${progress.total} (${percentage}%)`);
  };

  /**
   * Refresh critical cache entries after sync
   */
  private async refreshCriticalCache(): Promise<void> {
    try {
      // Cache keys that should be refreshed after sync
      const criticalKeys = [
        'recent_trades',
        'top_traded_stocks',
        'most_active_traders',
        'trade_statistics'
      ];

      for (const key of criticalKeys) {
        await this.cacheService.delete(key);
      }

      console.log(`Cleared ${criticalKeys.length} critical cache keys`);
    } catch (error) {
      console.error('Error refreshing critical cache:', error);
      throw error;
    }
  }
}

/**
 * Standalone function to run sync job
 */
export async function runTradingDataSync(options: JobOptions = {}): Promise<JobResult> {
  const job = new TradingDataSyncJob();
  return job.run(options);
}

/**
 * Standalone function to test sync job
 */
export async function testTradingDataSync(limit = 5): Promise<JobResult> {
  const job = new TradingDataSyncJob();
  return job.testRun(limit);
}

/**
 * CLI entry point for running sync job
 */
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const options: JobOptions = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--test':
          const limit = args[i + 1] ? parseInt(args[i + 1]) : 5;
          console.log('🧪 Running test sync...');
          try {
            const result = await testTradingDataSync(limit);
            console.log('✅ Test sync completed:', result.success ? 'SUCCESS' : 'FAILED');
            process.exit(result.success ? 0 : 1);
          } catch (error) {
            console.error('❌ Test sync failed:', error);
            process.exit(1);
          }
          return;

        case '--insiders':
          options.syncInsiders = true;
          break;

        case '--force':
          options.forceUpdate = true;
          break;

        case '--clear-cache':
          options.clearCache = true;
          break;

        case '--verbose':
          options.enableProgressLogging = true;
          break;

        case '--limit':
          if (args[i + 1]) {
            options.maxRecords = parseInt(args[i + 1]);
            i++; // Skip next argument
          }
          break;

        case '--help':
          console.log(`
Trading Data Sync Job

Usage: node syncTradingData.js [options]

Options:
  --test [limit]    Run a test sync with limited records (default: 5)
  --insiders        Include insider trading data
  --force           Force update existing records
  --clear-cache     Clear all cache before sync
  --verbose         Enable progress logging
  --limit <num>     Maximum records to process
  --help            Show this help message

Examples:
  node syncTradingData.js --test 10
  node syncTradingData.js --insiders --verbose
  node syncTradingData.js --force --clear-cache --limit 1000
          `);
          process.exit(0);
      }
    }

    // Run the full sync
    console.log('🚀 Running full trading data sync...');
    try {
      const result = await runTradingDataSync(options);
      console.log('✅ Sync completed:', result.success ? 'SUCCESS' : 'FAILED');
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    }
  }

  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default TradingDataSyncJob;