/**
 * Job Scheduler
 *
 * Schedules and manages background jobs for the application.
 *
 * NOTE: This implementation uses simple setInterval for scheduling.
 * For production, consider using a more robust solution like:
 * - node-cron (npm install node-cron)
 * - bull (Redis-based job queue)
 * - agenda (MongoDB-based job scheduler)
 */

import { runDailySync, runIncrementalSync } from './dailySync';

interface SchedulerOptions {
  enableDailySync?: boolean;
  enableIncrementalSync?: boolean;
  dailySyncHour?: number; // 0-23, default: 2 (2 AM)
  incrementalSyncInterval?: number; // Minutes, default: 60 (1 hour)
}

class JobScheduler {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning: boolean = false;

  /**
   * Start the job scheduler
   */
  start(options: SchedulerOptions = {}): void {
    const {
      enableDailySync = true,
      enableIncrementalSync = false,
      dailySyncHour = 2,
      incrementalSyncInterval = 60
    } = options;

    if (this.isRunning) {
      console.warn('⚠️  Job scheduler is already running');
      return;
    }

    console.log('🕐 Starting job scheduler...');
    this.isRunning = true;

    // Schedule daily sync
    if (enableDailySync) {
      this.scheduleDailySync(dailySyncHour);
    }

    // Schedule incremental sync
    if (enableIncrementalSync) {
      this.scheduleIncrementalSync(incrementalSyncInterval);
    }

    console.log('✅ Job scheduler started successfully\n');
  }

  /**
   * Schedule daily sync job to run at specific hour
   */
  private scheduleDailySync(hour: number): void {
    console.log(`📅 Scheduling daily sync for ${hour}:00 (${this.formatHour(hour)})`);

    // Check every minute if it's time to run
    const interval = setInterval(async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Run at the specified hour, during the first minute
      if (currentHour === hour && currentMinute === 0) {
        console.log(`\n⏰ Time to run daily sync (${this.formatHour(hour)})`);

        try {
          await runDailySync();
        } catch (error) {
          console.error('❌ Daily sync job failed:', error);
          // Don't throw - let the scheduler continue running
        }
      }
    }, 60 * 1000); // Check every minute

    this.intervals.push(interval);
  }

  /**
   * Schedule incremental sync to run at regular intervals
   */
  private scheduleIncrementalSync(intervalMinutes: number): void {
    console.log(`📅 Scheduling incremental sync every ${intervalMinutes} minutes`);

    // Run immediately on start
    setTimeout(async () => {
      console.log('\n⏰ Running initial incremental sync...');
      try {
        await runIncrementalSync();
      } catch (error) {
        console.error('❌ Incremental sync failed:', error);
      }
    }, 5000); // Wait 5 seconds after server start

    // Then run at regular intervals
    const interval = setInterval(async () => {
      console.log(`\n⏰ Time to run incremental sync`);

      try {
        await runIncrementalSync();
      } catch (error) {
        console.error('❌ Incremental sync job failed:', error);
        // Don't throw - let the scheduler continue running
      }
    }, intervalMinutes * 60 * 1000);

    this.intervals.push(interval);
  }

  /**
   * Stop the job scheduler and clear all intervals
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('⚠️  Job scheduler is not running');
      return;
    }

    console.log('🛑 Stopping job scheduler...');

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;

    console.log('✅ Job scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; jobCount: number } {
    return {
      running: this.isRunning,
      jobCount: this.intervals.length
    };
  }

  /**
   * Format hour for display
   */
  private formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }

  /**
   * Manually trigger daily sync (for testing or admin purposes)
   */
  async triggerDailySync(): Promise<void> {
    console.log('🔧 Manually triggering daily sync...');
    await runDailySync();
  }

  /**
   * Manually trigger incremental sync (for testing or admin purposes)
   */
  async triggerIncrementalSync(): Promise<void> {
    console.log('🔧 Manually triggering incremental sync...');
    await runIncrementalSync();
  }
}

// Singleton instance
const scheduler = new JobScheduler();

export { scheduler, JobScheduler };
export default scheduler;
