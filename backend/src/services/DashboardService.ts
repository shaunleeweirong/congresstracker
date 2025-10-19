import { db } from '../config/database';
import { CacheService } from './CacheService';

export interface DashboardMetrics {
  totalTrades: number;
  activeMembers: number;
  totalVolume: number;
  alertsTriggered: number;
}

export interface DashboardMetricsDetailed {
  totalTrades: number;
  activeMembers: number;
  totalVolume: number;
  alertsTriggered: number;
  breakdown: {
    senate: {
      trades: number;
      members: number;
      volume: number;
    };
    house: {
      trades: number;
      members: number;
      volume: number;
    };
  };
  lastUpdated: string;
}

export class DashboardService {
  private cacheService: CacheService;
  private readonly CACHE_KEY = 'dashboard:metrics';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(cacheService?: CacheService) {
    this.cacheService = cacheService || new CacheService();
  }

  /**
   * Get dashboard metrics (cached)
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Try cache first
      const cached = await this.cacheService.get<DashboardMetrics>(this.CACHE_KEY);
      if (cached) {
        console.log('✅ Dashboard metrics cache hit');
        return cached;
      }

      console.log('❌ Dashboard metrics cache miss - calculating...');

      // Calculate metrics from database
      const metrics = await this.calculateMetrics();

      // Cache the result
      await this.cacheService.set(this.CACHE_KEY, metrics, this.CACHE_TTL);

      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get detailed dashboard metrics with breakdown
   */
  async getDashboardMetricsDetailed(): Promise<DashboardMetricsDetailed> {
    try {
      const client = await db.connect();

      try {
        // 1. Total Trades (overall and by chamber)
        const tradesResult = await client.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN cm.position = 'senator' THEN 1 ELSE 0 END) as senate_trades,
            SUM(CASE WHEN cm.position = 'representative' THEN 1 ELSE 0 END) as house_trades
          FROM stock_trades st
          LEFT JOIN congressional_members cm ON st.trader_id = cm.id AND st.trader_type = 'congressional'
        `);

        // 2. Active Members (overall and by chamber)
        const membersResult = await client.query(`
          SELECT
            COUNT(DISTINCT cm.id) as total,
            COUNT(DISTINCT CASE WHEN cm.position = 'senator' THEN cm.id END) as senators,
            COUNT(DISTINCT CASE WHEN cm.position = 'representative' THEN cm.id END) as representatives
          FROM congressional_members cm
          INNER JOIN stock_trades st ON st.trader_id = cm.id AND st.trader_type = 'congressional'
        `);

        // 3. Total Volume (last 30 days, by chamber)
        const volumeResult = await client.query(`
          SELECT
            COALESCE(SUM(st.estimated_value), 0) as total_volume,
            COALESCE(SUM(CASE WHEN cm.position = 'senator' THEN st.estimated_value ELSE 0 END), 0) as senate_volume,
            COALESCE(SUM(CASE WHEN cm.position = 'representative' THEN st.estimated_value ELSE 0 END), 0) as house_volume
          FROM stock_trades st
          LEFT JOIN congressional_members cm ON st.trader_id = cm.id AND st.trader_type = 'congressional'
          WHERE st.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        `);

        // 4. Alerts Triggered (last 24 hours)
        const alertsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM alert_notifications
          WHERE delivered_at >= NOW() - INTERVAL '24 hours'
        `);

        const metrics: DashboardMetricsDetailed = {
          totalTrades: parseInt(tradesResult.rows[0].total || '0'),
          activeMembers: parseInt(membersResult.rows[0].total || '0'),
          totalVolume: parseFloat(volumeResult.rows[0].total_volume || '0'),
          alertsTriggered: parseInt(alertsResult.rows[0].count || '0'),
          breakdown: {
            senate: {
              trades: parseInt(tradesResult.rows[0].senate_trades || '0'),
              members: parseInt(membersResult.rows[0].senators || '0'),
              volume: parseFloat(volumeResult.rows[0].senate_volume || '0')
            },
            house: {
              trades: parseInt(tradesResult.rows[0].house_trades || '0'),
              members: parseInt(membersResult.rows[0].representatives || '0'),
              volume: parseFloat(volumeResult.rows[0].house_volume || '0')
            }
          },
          lastUpdated: new Date().toISOString()
        };

        return metrics;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error calculating detailed dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate metrics from database
   */
  private async calculateMetrics(): Promise<DashboardMetrics> {
    const client = await db.connect();

    try {
      // 1. Total Trades
      const tradesResult = await client.query('SELECT COUNT(*) as count FROM stock_trades');
      const totalTrades = parseInt(tradesResult.rows[0].count || '0');

      // 2. Active Members (unique congressional members who have trades)
      const membersResult = await client.query(`
        SELECT COUNT(DISTINCT cm.id) as count
        FROM congressional_members cm
        INNER JOIN stock_trades st ON st.trader_id = cm.id AND st.trader_type = 'congressional'
      `);
      const activeMembers = parseInt(membersResult.rows[0].count || '0');

      // 3. Total Volume (last 30 days)
      const volumeResult = await client.query(`
        SELECT COALESCE(SUM(estimated_value), 0) as volume
        FROM stock_trades
        WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      const totalVolume = parseFloat(volumeResult.rows[0].volume || '0');

      // 4. Alerts Triggered (last 24 hours)
      const alertsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM alert_notifications
        WHERE delivered_at >= NOW() - INTERVAL '24 hours'
      `);
      const alertsTriggered = parseInt(alertsResult.rows[0].count || '0');

      return {
        totalTrades,
        activeMembers,
        totalVolume,
        alertsTriggered
      };
    } finally {
      client.release();
    }
  }

  /**
   * Invalidate dashboard metrics cache
   * Call this after syncing new data
   */
  async invalidateCache(): Promise<void> {
    try {
      await this.cacheService.delete(this.CACHE_KEY);
      console.log('✅ Dashboard metrics cache invalidated');
    } catch (error) {
      console.error('Error invalidating dashboard cache:', error);
      // Don't throw - cache invalidation failure shouldn't break the app
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{ cached: boolean; ttl: number | null }> {
    try {
      const cached = await this.cacheService.get<DashboardMetrics>(this.CACHE_KEY);
      const ttl = cached ? await this.cacheService.getTTL(this.CACHE_KEY) : null;

      return {
        cached: !!cached,
        ttl
      };
    } catch (error) {
      return { cached: false, ttl: null };
    }
  }
}

export default DashboardService;
