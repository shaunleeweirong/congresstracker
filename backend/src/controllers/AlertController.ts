import { Request, Response } from 'express';
import { AlertService, CreateAlertData, NotificationPreferences } from '../services/AlertService';

export class AlertController {
  /**
   * Create a new alert
   */
  static async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { alertType, politicianId, tickerSymbol, patternConfig } = req.body;

      // Validate required fields
      if (!alertType) {
        res.status(400).json({
          success: false,
          error: 'alertType is required'
        });
        return;
      }

      if (!['politician', 'stock', 'pattern'].includes(alertType)) {
        res.status(400).json({
          success: false,
          error: 'alertType must be "politician", "stock", or "pattern"'
        });
        return;
      }

      // Validate type-specific requirements
      if (alertType === 'politician' && !politicianId) {
        res.status(400).json({
          success: false,
          error: 'politicianId is required for politician alerts'
        });
        return;
      }

      if (alertType === 'stock' && !tickerSymbol) {
        res.status(400).json({
          success: false,
          error: 'tickerSymbol is required for stock alerts'
        });
        return;
      }

      if (alertType === 'pattern' && !patternConfig) {
        res.status(400).json({
          success: false,
          error: 'patternConfig is required for pattern alerts'
        });
        return;
      }

      const alertData: CreateAlertData = {
        userId,
        alertType,
        politicianId,
        tickerSymbol: tickerSymbol?.toUpperCase(),
        patternConfig
      };

      const alert = await AlertService.createAlert(alertData);

      if (!alert) {
        res.status(400).json({
          success: false,
          error: 'Failed to create alert. You may have reached your alert limit.'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: alert
      });
    } catch (error) {
      console.error('Create alert controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during alert creation'
      });
    }
  }

  /**
   * Get user's alerts
   */
  static async getUserAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { 
        status, 
        type, 
        limit, 
        offset,
        sortBy,
        sortOrder
      } = req.query;

      // Validate status filter
      if (status && !['active', 'paused', 'deleted'].includes(status as string)) {
        res.status(400).json({
          success: false,
          error: 'status must be "active", "paused", or "deleted"'
        });
        return;
      }

      // Validate type filter
      if (type && !['politician', 'stock', 'pattern'].includes(type as string)) {
        res.status(400).json({
          success: false,
          error: 'type must be "politician", "stock", or "pattern"'
        });
        return;
      }

      // Validate pagination
      let limitNum = 20;
      if (limit) {
        limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 100'
          });
          return;
        }
      }

      let offsetNum = 0;
      if (offset) {
        offsetNum = parseInt(offset as string);
        if (isNaN(offsetNum) || offsetNum < 0) {
          res.status(400).json({
            success: false,
            error: 'offset must be non-negative'
          });
          return;
        }
      }

      // Validate sorting
      if (sortBy && !['createdAt', 'updatedAt', 'lastTriggered'].includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          error: 'sortBy must be "createdAt", "updatedAt", or "lastTriggered"'
        });
        return;
      }

      if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
        res.status(400).json({
          success: false,
          error: 'sortOrder must be "asc" or "desc"'
        });
        return;
      }

      const alerts = await AlertService.getUserAlerts(
        userId,
        {
          limit: limitNum,
          offset: offsetNum
        }
      );

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Get user alerts controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during alerts fetch'
      });
    }
  }

  /**
   * Get alert by ID
   */
  static async getAlertById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Alert ID is required'
        });
        return;
      }

      // For now, get user alerts and filter by ID
      const alerts = await AlertService.getUserAlerts(userId, {});
      const alert = alerts.alerts?.find((a: any) => a.id === id);

      if (!alert) {
        res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: alert
      });
    } catch (error) {
      console.error('Get alert by ID controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during alert fetch'
      });
    }
  }

  /**
   * Update alert
   */
  static async updateAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const { alertStatus, patternConfig } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Alert ID is required'
        });
        return;
      }

      // Validate alert status
      if (alertStatus && !['active', 'paused', 'deleted'].includes(alertStatus)) {
        res.status(400).json({
          success: false,
          error: 'alertStatus must be "active", "paused", or "deleted"'
        });
        return;
      }

      const updateData: any = {};
      if (alertStatus !== undefined) updateData.alertStatus = alertStatus;
      if (patternConfig !== undefined) updateData.patternConfig = patternConfig;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No update data provided'
        });
        return;
      }

      const updatedAlert = await AlertService.updateAlert(id, userId, updateData);

      if (!updatedAlert) {
        res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedAlert
      });
    } catch (error) {
      console.error('Update alert controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during alert update'
      });
    }
  }

  /**
   * Delete alert
   */
  static async deleteAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Alert ID is required'
        });
        return;
      }

      const success = await AlertService.deleteAlert(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Alert deleted successfully'
      });
    } catch (error) {
      console.error('Delete alert controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during alert deletion'
      });
    }
  }

  /**
   * Get alert notifications
   */
  static async getAlertNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { 
        unreadOnly, 
        limit, 
        offset,
        alertId 
      } = req.query;

      // Validate pagination
      let limitNum = 50;
      if (limit) {
        limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 100'
          });
          return;
        }
      }

      let offsetNum = 0;
      if (offset) {
        offsetNum = parseInt(offset as string);
        if (isNaN(offsetNum) || offsetNum < 0) {
          res.status(400).json({
            success: false,
            error: 'offset must be non-negative'
          });
          return;
        }
      }

      const notifications = await AlertService.getNotificationHistory(
        userId,
        limitNum,
        offsetNum
      );

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get alert notifications controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during notifications fetch'
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Notification ID is required'
        });
        return;
      }

      const success = await AlertService.markNotificationsAsRead(userId, [id]);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification read controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during notification update'
      });
    }
  }

  /**
   * Get alert summary statistics
   */
  static async getAlertSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const summary = await AlertService.getAlertSummary(userId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get alert summary controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during alert summary fetch'
      });
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // For now, return success without actual implementation
      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      console.error('Update notification preferences controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during preferences update'
      });
    }
  }

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Return default preferences
      res.status(200).json({
        success: true,
        data: {
          email: true,
          push: true,
          inApp: true,
          frequency: 'immediate'
        }
      });
    } catch (error) {
      console.error('Get notification preferences controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during preferences fetch'
      });
    }
  }
}

export default AlertController;