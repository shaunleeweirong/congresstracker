import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService?: DashboardService) {
    this.dashboardService = dashboardService || new DashboardService();
  }

  /**
   * Get dashboard metrics
   * GET /api/v1/dashboard/metrics
   */
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await this.dashboardService.getDashboardMetrics();

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error in getMetrics:', error);
      next(error);
    }
  }

  /**
   * Get detailed dashboard metrics with breakdown
   * GET /api/v1/dashboard/metrics/detailed
   */
  async getMetricsDetailed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await this.dashboardService.getDashboardMetricsDetailed();

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error in getMetricsDetailed:', error);
      next(error);
    }
  }

  /**
   * Invalidate dashboard metrics cache
   * POST /api/v1/dashboard/cache/invalidate
   * (Admin/Internal use only)
   */
  async invalidateCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.dashboardService.invalidateCache();

      res.status(200).json({
        success: true,
        message: 'Dashboard metrics cache invalidated'
      });
    } catch (error) {
      console.error('Error in invalidateCache:', error);
      next(error);
    }
  }

  /**
   * Get cache status
   * GET /api/v1/dashboard/cache/status
   */
  async getCacheStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await this.dashboardService.getCacheStatus();

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error in getCacheStatus:', error);
      next(error);
    }
  }
}

export default DashboardController;
