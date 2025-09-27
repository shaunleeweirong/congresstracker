import { UserAlert } from '../models/UserAlert';
import { AlertNotification } from '../models/AlertNotification';
import { User } from '../models/User';
import { CongressionalMember } from '../models/CongressionalMember';
import { StockTicker } from '../models/StockTicker';
import { StockTrade } from '../models/StockTrade';

export interface CreateAlertData {
  userId: string;
  alertType: 'politician' | 'stock' | 'pattern';
  alertStatus?: 'active' | 'paused' | 'deleted';
  politicianId?: string;
  tickerSymbol?: string;
  patternConfig?: any;
}

export interface AlertMatchData {
  alertId: string;
  matchData: any;
  triggerReason: string;
}

export interface AlertSummary {
  totalAlerts: number;
  activeAlerts: number;
  pausedAlerts: number;
  triggeredToday: number;
  triggeredThisWeek: number;
  byType: {
    politician: number;
    stock: number;
    pattern: number;
  };
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
}

export class AlertService {
  private static readonly MAX_ALERTS_PER_USER = 100;
  private static readonly MAX_ALERTS_FREE_USER = 10;

  /**
   * Create a new alert for a user
   */
  static async createAlert(alertData: CreateAlertData): Promise<UserAlert | null> {
    try {
      // Validate user exists
      const user = await User.findById(alertData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check user's alert limit
      const userAlertCount = await UserAlert.countByUser(alertData.userId);
      const maxAlerts = user.subscriptionStatus === 'active' 
        ? this.MAX_ALERTS_PER_USER 
        : this.MAX_ALERTS_FREE_USER;

      if (userAlertCount >= maxAlerts) {
        throw new Error(`Alert limit reached. Maximum ${maxAlerts} alerts allowed.`);
      }

      // Validate alert data
      const validation = this.validateAlertData(alertData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check if politician/stock exists
      if (alertData.alertType === 'politician' && alertData.politicianId) {
        const politician = await CongressionalMember.findById(alertData.politicianId);
        if (!politician) {
          throw new Error('Politician not found');
        }
      }

      if (alertData.alertType === 'stock' && alertData.tickerSymbol) {
        const stock = await StockTicker.findBySymbol(alertData.tickerSymbol);
        if (!stock) {
          throw new Error('Stock not found');
        }
      }

      // Check for duplicate alerts
      const existingAlert = await this.findDuplicateAlert(alertData);
      if (existingAlert) {
        throw new Error('Similar alert already exists');
      }

      // Create alert
      return await UserAlert.create(alertData);
    } catch (error) {
      console.error('Create alert error:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a user
   */
  static async getUserAlerts(
    userId: string,
    filters: {
      alertType?: 'politician' | 'stock' | 'pattern';
      alertStatus?: 'active' | 'paused' | 'deleted';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ alerts: UserAlert[]; total: number }> {
    try {
      const {
        alertType,
        alertStatus = 'active',
        limit = 50,
        offset = 0
      } = filters;

      return await UserAlert.findByUser(
        userId,
        { alertType, alertStatus },
        limit,
        offset
      );
    } catch (error) {
      console.error('Get user alerts error:', error);
      return { alerts: [], total: 0 };
    }
  }

  /**
   * Update alert
   */
  static async updateAlert(
    alertId: string,
    userId: string,
    updateData: Partial<CreateAlertData>
  ): Promise<UserAlert | null> {
    try {
      const alert = await UserAlert.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      // Verify ownership
      if (alert.userId !== userId) {
        throw new Error('Access denied');
      }

      // Validate update data
      if (updateData.alertType || updateData.politicianId || updateData.tickerSymbol) {
        const validation = this.validateAlertData({ ...alert, ...updateData } as CreateAlertData);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      return await alert.update(updateData);
    } catch (error) {
      console.error('Update alert error:', error);
      throw error;
    }
  }

  /**
   * Delete alert
   */
  static async deleteAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const alert = await UserAlert.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      // Verify ownership
      if (alert.userId !== userId) {
        throw new Error('Access denied');
      }

      // Soft delete by setting status to 'deleted'
      const updated = await alert.update({ alertStatus: 'deleted' });
      return !!updated;
    } catch (error) {
      console.error('Delete alert error:', error);
      throw error;
    }
  }

  /**
   * Toggle alert status (active/paused)
   */
  static async toggleAlert(alertId: string, userId: string): Promise<UserAlert | null> {
    try {
      const alert = await UserAlert.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      // Verify ownership
      if (alert.userId !== userId) {
        throw new Error('Access denied');
      }

      const newStatus = alert.alertStatus === 'active' ? 'paused' : 'active';
      return await alert.update({ alertStatus: newStatus });
    } catch (error) {
      console.error('Toggle alert error:', error);
      throw error;
    }
  }

  /**
   * Check for alert matches against new trades
   */
  static async checkTradeAlerts(trade: StockTrade): Promise<void> {
    try {
      // Get all active alerts that might match this trade
      const potentialAlerts = await this.getPotentialAlerts(trade);

      for (const alert of potentialAlerts) {
        const isMatch = await this.evaluateAlertMatch(alert, trade);
        if (isMatch) {
          await this.triggerAlert(alert, {
            trade,
            triggerReason: this.getAlertTriggerReason(alert, trade)
          });
        }
      }
    } catch (error) {
      console.error('Check trade alerts error:', error);
    }
  }

  /**
   * Trigger an alert and create notification
   */
  static async triggerAlert(alert: UserAlert, matchData: any): Promise<void> {
    try {
      // Create notification
      await AlertNotification.create({
        alertId: alert.id!,
        userId: alert.userId,
        notificationType: 'trade_match',
        notificationData: matchData,
        deliveryStatus: 'pending'
      });

      // Update alert's last triggered timestamp
      await alert.updateLastTriggered();

      // Send notification based on user preferences
      await this.sendNotification(alert, matchData);
    } catch (error) {
      console.error('Trigger alert error:', error);
    }
  }

  /**
   * Get alert summary for a user
   */
  static async getAlertSummary(userId: string): Promise<AlertSummary> {
    try {
      const alerts = await UserAlert.findAllByUser(userId);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - 7);

      const summary: AlertSummary = {
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => a.alertStatus === 'active').length,
        pausedAlerts: alerts.filter(a => a.alertStatus === 'paused').length,
        triggeredToday: 0,
        triggeredThisWeek: 0,
        byType: {
          politician: alerts.filter(a => a.alertType === 'politician').length,
          stock: alerts.filter(a => a.alertType === 'stock').length,
          pattern: alerts.filter(a => a.alertType === 'pattern').length
        }
      };

      // Get notification counts
      const notifications = await AlertNotification.findByUser(userId, {}, 1000, 0);
      
      summary.triggeredToday = notifications.notifications.filter(
        n => n.createdAt && n.createdAt >= todayStart
      ).length;

      summary.triggeredThisWeek = notifications.notifications.filter(
        n => n.createdAt && n.createdAt >= weekStart
      ).length;

      return summary;
    } catch (error) {
      console.error('Get alert summary error:', error);
      return {
        totalAlerts: 0,
        activeAlerts: 0,
        pausedAlerts: 0,
        triggeredToday: 0,
        triggeredThisWeek: 0,
        byType: { politician: 0, stock: 0, pattern: 0 }
      };
    }
  }

  /**
   * Get user's notification history
   */
  static async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: AlertNotification[]; total: number }> {
    try {
      return await AlertNotification.findByUser(userId, {}, limit, offset);
    } catch (error) {
      console.error('Get notification history error:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<number> {
    try {
      let updatedCount = 0;
      
      for (const notificationId of notificationIds) {
        const notification = await AlertNotification.findById(notificationId);
        if (notification && notification.userId === userId) {
          const updated = await notification.markAsRead();
          if (updated) updatedCount++;
        }
      }

      return updatedCount;
    } catch (error) {
      console.error('Mark notifications as read error:', error);
      return 0;
    }
  }

  /**
   * Get alerts that might match a trade
   */
  private static async getPotentialAlerts(trade: StockTrade): Promise<UserAlert[]> {
    const alerts: UserAlert[] = [];

    // Get politician alerts
    if (trade.traderType === 'congressional') {
      const politicianAlerts = await UserAlert.findByPolitician(trade.traderId);
      alerts.push(...politicianAlerts);
    }

    // Get stock alerts
    const stockAlerts = await UserAlert.findByStock(trade.tickerSymbol);
    alerts.push(...stockAlerts);

    // Get pattern alerts (these need to be evaluated individually)
    const patternAlerts = await UserAlert.findByType('pattern');
    alerts.push(...patternAlerts);

    return alerts.filter(alert => alert.alertStatus === 'active');
  }

  /**
   * Evaluate if an alert matches a trade
   */
  private static async evaluateAlertMatch(alert: UserAlert, trade: StockTrade): Promise<boolean> {
    try {
      switch (alert.alertType) {
        case 'politician':
          return alert.politicianId === trade.traderId;

        case 'stock':
          return alert.tickerSymbol === trade.tickerSymbol;

        case 'pattern':
          return this.evaluatePatternMatch(alert.patternConfig, trade);

        default:
          return false;
      }
    } catch (error) {
      console.error('Evaluate alert match error:', error);
      return false;
    }
  }

  /**
   * Evaluate pattern-based alert matches
   */
  private static evaluatePatternMatch(patternConfig: any, trade: StockTrade): boolean {
    if (!patternConfig) return false;

    try {
      // Transaction type filter
      if (patternConfig.transactionType && patternConfig.transactionType !== trade.transactionType) {
        return false;
      }

      // Value threshold filter
      if (patternConfig.minValue && trade.estimatedValue && trade.estimatedValue < patternConfig.minValue) {
        return false;
      }

      if (patternConfig.maxValue && trade.estimatedValue && trade.estimatedValue > patternConfig.maxValue) {
        return false;
      }

      // Sector filter
      if (patternConfig.sectors && patternConfig.sectors.length > 0) {
        // This would require joining with stock ticker data
        // Implementation depends on trade model structure
      }

      // Party filter (for congressional trades)
      if (patternConfig.parties && patternConfig.parties.length > 0 && trade.traderType === 'congressional') {
        // This would require joining with congressional member data
        // Implementation depends on trade model structure
      }

      return true;
    } catch (error) {
      console.error('Evaluate pattern match error:', error);
      return false;
    }
  }

  /**
   * Get alert trigger reason
   */
  private static getAlertTriggerReason(alert: UserAlert, trade: StockTrade): string {
    switch (alert.alertType) {
      case 'politician':
        return `New ${trade.transactionType} trade by monitored politician`;
      case 'stock':
        return `New ${trade.transactionType} trade in monitored stock ${trade.tickerSymbol}`;
      case 'pattern':
        return 'Trade matches your custom pattern criteria';
      default:
        return 'Alert triggered';
    }
  }

  /**
   * Send notification based on user preferences
   */
  private static async sendNotification(alert: UserAlert, matchData: any): Promise<void> {
    try {
      // Get user notification preferences
      const user = await User.findById(alert.userId);
      if (!user) return;

      // This would integrate with actual notification services
      // For now, just log the notification
      console.log(`Notification for user ${alert.userId}: Alert ${alert.id} triggered`);

      // TODO: Implement actual notification delivery
      // - Email notifications via SendGrid/SES
      // - Push notifications via Firebase/OneSignal
      // - In-app notifications via WebSocket/SSE
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }

  /**
   * Find duplicate alert
   */
  private static async findDuplicateAlert(alertData: CreateAlertData): Promise<UserAlert | null> {
    try {
      const existingAlerts = await UserAlert.findByUser(alertData.userId, {
        alertType: alertData.alertType,
        alertStatus: 'active'
      });

      return existingAlerts.alerts.find(alert => {
        if (alertData.alertType === 'politician') {
          return alert.politicianId === alertData.politicianId;
        } else if (alertData.alertType === 'stock') {
          return alert.tickerSymbol === alertData.tickerSymbol;
        } else if (alertData.alertType === 'pattern') {
          // For pattern alerts, check for similar configuration
          return JSON.stringify(alert.patternConfig) === JSON.stringify(alertData.patternConfig);
        }
        return false;
      }) || null;
    } catch (error) {
      console.error('Find duplicate alert error:', error);
      return null;
    }
  }

  /**
   * Validate alert data
   */
  private static validateAlertData(data: CreateAlertData): { isValid: boolean; error?: string } {
    if (!data.userId) {
      return { isValid: false, error: 'User ID is required' };
    }

    if (!data.alertType) {
      return { isValid: false, error: 'Alert type is required' };
    }

    if (!['politician', 'stock', 'pattern'].includes(data.alertType)) {
      return { isValid: false, error: 'Invalid alert type' };
    }

    if (data.alertType === 'politician' && !data.politicianId) {
      return { isValid: false, error: 'Politician ID is required for politician alerts' };
    }

    if (data.alertType === 'stock' && !data.tickerSymbol) {
      return { isValid: false, error: 'Ticker symbol is required for stock alerts' };
    }

    if (data.alertType === 'pattern' && !data.patternConfig) {
      return { isValid: false, error: 'Pattern configuration is required for pattern alerts' };
    }

    return { isValid: true };
  }
}

export default AlertService;