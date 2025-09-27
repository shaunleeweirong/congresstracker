import { db } from '../config/database';
import { PoolClient } from 'pg';

export type NotificationType = 'in_app';

export interface AlertNotificationData {
  id?: string;
  alertId: string;
  userId: string;
  tradeId?: string;
  notificationType?: NotificationType;
  message: string;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface CreateAlertNotificationData {
  alertId: string;
  userId: string;
  tradeId?: string;
  notificationType?: NotificationType;
  message: string;
}

export interface AlertNotificationFilters {
  userId?: string;
  alertId?: string;
  tradeId?: string;
  isRead?: boolean;
  notificationType?: NotificationType;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationWithDetails extends AlertNotificationData {
  alert?: {
    id: string;
    alertType: string;
    alertStatus: string;
    politicianId?: string;
    tickerSymbol?: string;
  };
  trade?: {
    id: string;
    traderType: string;
    traderId: string;
    tickerSymbol: string;
    transactionType: string;
    transactionDate: Date;
    estimatedValue?: number;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

export class AlertNotification {
  id?: string;
  alertId: string;
  userId: string;
  tradeId?: string;
  notificationType: NotificationType;
  message: string;
  deliveredAt?: Date;
  readAt?: Date;

  constructor(data: AlertNotificationData) {
    this.id = data.id;
    this.alertId = data.alertId;
    this.userId = data.userId;
    this.tradeId = data.tradeId;
    this.notificationType = data.notificationType || 'in_app';
    this.message = data.message;
    this.deliveredAt = data.deliveredAt;
    this.readAt = data.readAt;
  }

  /**
   * Create a new alert notification
   */
  static async create(notificationData: CreateAlertNotificationData): Promise<AlertNotification> {
    // Validate required fields
    if (!notificationData.alertId || !notificationData.userId || !notificationData.message) {
      throw new Error('Alert ID, user ID, and message are required');
    }

    // Validate message length
    if (notificationData.message.length > 1000) {
      throw new Error('Message cannot exceed 1000 characters');
    }

    const client = await db.connect();
    try {
      // Verify alert exists and belongs to the user
      const alert = await client.query(
        'SELECT id, user_id FROM user_alerts WHERE id = $1',
        [notificationData.alertId]
      );

      if (alert.rows.length === 0) {
        throw new Error('Alert does not exist');
      }

      if (alert.rows[0].user_id !== notificationData.userId) {
        throw new Error('Alert does not belong to the specified user');
      }

      // Verify user exists
      const user = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [notificationData.userId]
      );

      if (user.rows.length === 0) {
        throw new Error('User does not exist');
      }

      // Verify trade exists if provided
      if (notificationData.tradeId) {
        const trade = await client.query(
          'SELECT id FROM stock_trades WHERE id = $1',
          [notificationData.tradeId]
        );

        if (trade.rows.length === 0) {
          throw new Error('Trade does not exist');
        }
      }

      // Insert new notification
      const result = await client.query(
        `INSERT INTO alert_notifications 
         (alert_id, user_id, trade_id, notification_type, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          notificationData.alertId,
          notificationData.userId,
          notificationData.tradeId || null,
          notificationData.notificationType || 'in_app',
          notificationData.message
        ]
      );

      const notificationRow = result.rows[0];
      return new AlertNotification({
        id: notificationRow.id,
        alertId: notificationRow.alert_id,
        userId: notificationRow.user_id,
        tradeId: notificationRow.trade_id,
        notificationType: notificationRow.notification_type,
        message: notificationRow.message,
        deliveredAt: notificationRow.delivered_at,
        readAt: notificationRow.read_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Find notification by ID
   */
  static async findById(id: string): Promise<AlertNotification | null> {
    if (!id) {
      return null;
    }

    const result = await db.findById('alert_notifications', id);
    if (!result) {
      return null;
    }

    return new AlertNotification({
      id: result.id,
      alertId: result.alert_id,
      userId: result.user_id,
      tradeId: result.trade_id,
      notificationType: result.notification_type,
      message: result.message,
      deliveredAt: result.delivered_at,
      readAt: result.read_at
    });
  }

  /**
   * Find notifications with details
   */
  static async findWithDetails(
    filters: AlertNotificationFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationWithDetails[]> {
    const client = await db.connect();
    try {
      let query = `
        SELECT 
          an.*,
          json_build_object(
            'id', ua.id,
            'alertType', ua.alert_type,
            'alertStatus', ua.alert_status,
            'politicianId', ua.politician_id,
            'tickerSymbol', ua.ticker_symbol
          ) as alert,
          CASE 
            WHEN an.trade_id IS NOT NULL THEN
              json_build_object(
                'id', st.id,
                'traderType', st.trader_type,
                'traderId', st.trader_id,
                'tickerSymbol', st.ticker_symbol,
                'transactionType', st.transaction_type,
                'transactionDate', st.transaction_date,
                'estimatedValue', st.estimated_value
              )
            ELSE NULL
          END as trade
        FROM alert_notifications an
        LEFT JOIN user_alerts ua ON an.alert_id = ua.id
        LEFT JOIN stock_trades st ON an.trade_id = st.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCounter = 1;

      // Apply filters
      if (filters.userId) {
        query += ` AND an.user_id = $${paramCounter++}`;
        params.push(filters.userId);
      }

      if (filters.alertId) {
        query += ` AND an.alert_id = $${paramCounter++}`;
        params.push(filters.alertId);
      }

      if (filters.tradeId) {
        query += ` AND an.trade_id = $${paramCounter++}`;
        params.push(filters.tradeId);
      }

      if (filters.notificationType) {
        query += ` AND an.notification_type = $${paramCounter++}`;
        params.push(filters.notificationType);
      }

      if (filters.isRead === true) {
        query += ' AND an.read_at IS NOT NULL';
      } else if (filters.isRead === false) {
        query += ' AND an.read_at IS NULL';
      }

      if (filters.startDate) {
        query += ` AND an.delivered_at >= $${paramCounter++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND an.delivered_at <= $${paramCounter++}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY an.delivered_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        alertId: row.alert_id,
        userId: row.user_id,
        tradeId: row.trade_id,
        notificationType: row.notification_type,
        message: row.message,
        deliveredAt: row.delivered_at,
        readAt: row.read_at,
        alert: row.alert,
        trade: row.trade
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find user notifications
   */
  static async findByUser(
    userId: string,
    includeRead: boolean = true,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationWithDetails[]> {
    const filters: AlertNotificationFilters = { userId };
    if (!includeRead) {
      filters.isRead = false;
    }

    return AlertNotification.findWithDetails(filters, limit, offset);
  }

  /**
   * Find unread notifications for user
   */
  static async findUnreadByUser(userId: string, limit: number = 50): Promise<NotificationWithDetails[]> {
    return AlertNotification.findWithDetails({ userId, isRead: false }, limit, 0);
  }

  /**
   * Find recent notifications
   */
  static async findRecent(
    userId: string,
    days: number = 7,
    limit: number = 50
  ): Promise<NotificationWithDetails[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return AlertNotification.findWithDetails({ userId, startDate }, limit, 0);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(): Promise<void> {
    if (!this.id) {
      throw new Error('Notification ID is required to mark as read');
    }

    if (this.readAt) {
      return; // Already read
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE alert_notifications SET read_at = NOW() WHERE id = $1',
        [this.id]
      );
      this.readAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(): Promise<void> {
    if (!this.id) {
      throw new Error('Notification ID is required to mark as unread');
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE alert_notifications SET read_at = NULL WHERE id = $1',
        [this.id]
      );
      this.readAt = undefined;
    } finally {
      client.release();
    }
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'UPDATE alert_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
        [userId]
      );
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Delete notification
   */
  async delete(): Promise<void> {
    if (!this.id) {
      throw new Error('Notification ID is required to delete');
    }

    const client = await db.connect();
    try {
      await client.query(
        'DELETE FROM alert_notifications WHERE id = $1',
        [this.id]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async deleteOldNotifications(days: number = 90): Promise<number> {
    const client = await db.connect();
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await client.query(
        'DELETE FROM alert_notifications WHERE delivered_at < $1',
        [cutoffDate]
      );
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Get notification statistics for user
   */
  static async getUserStats(userId: string): Promise<NotificationStats> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread,
           SUM(CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END) as read,
           SUM(CASE WHEN delivered_at >= CURRENT_DATE THEN 1 ELSE 0 END) as today_count,
           SUM(CASE WHEN delivered_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as week_count,
           SUM(CASE WHEN delivered_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as month_count
         FROM alert_notifications 
         WHERE user_id = $1`,
        [userId]
      );

      const stats = result.rows[0];
      return {
        total: parseInt(stats.total) || 0,
        unread: parseInt(stats.unread) || 0,
        read: parseInt(stats.read) || 0,
        todayCount: parseInt(stats.today_count) || 0,
        weekCount: parseInt(stats.week_count) || 0,
        monthCount: parseInt(stats.month_count) || 0
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create notification from trade alert trigger
   */
  static async createFromTrade(
    alertId: string,
    userId: string,
    tradeId: string,
    tradeData: {
      traderName: string;
      traderType: 'congressional' | 'corporate';
      tickerSymbol: string;
      transactionType: 'buy' | 'sell' | 'exchange';
      estimatedValue?: number;
      transactionDate: Date;
    }
  ): Promise<AlertNotification> {
    // Generate appropriate message based on trade data
    const traderTypeLabel = tradeData.traderType === 'congressional' ? 'politician' : 'insider';
    const action = tradeData.transactionType.toUpperCase();
    const value = tradeData.estimatedValue 
      ? ` worth $${tradeData.estimatedValue.toLocaleString()}`
      : '';
    
    const message = `${tradeData.traderName} (${traderTypeLabel}) ${action} ${tradeData.tickerSymbol}${value}`;

    return AlertNotification.create({
      alertId,
      userId,
      tradeId,
      message
    });
  }

  /**
   * Bulk create notifications
   */
  static async bulkCreate(notifications: CreateAlertNotificationData[]): Promise<void> {
    if (!notifications || notifications.length === 0) {
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const notification of notifications) {
        await client.query(
          `INSERT INTO alert_notifications 
           (alert_id, user_id, trade_id, notification_type, message)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            notification.alertId,
            notification.userId,
            notification.tradeId || null,
            notification.notificationType || 'in_app',
            notification.message
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get notification count by alert
   */
  static async getAlertNotificationCount(alertId: string): Promise<number> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM alert_notifications WHERE alert_id = $1',
        [alertId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Get most active alert (by notification count)
   */
  static async getMostActiveAlerts(
    userId?: string,
    limit: number = 10
  ): Promise<Array<{
    alertId: string;
    notificationCount: number;
    lastNotificationAt: Date;
  }>> {
    const client = await db.connect();
    try {
      let query = `
        SELECT 
          alert_id,
          COUNT(*) as notification_count,
          MAX(delivered_at) as last_notification_at
        FROM alert_notifications
      `;

      const params: any[] = [];
      let paramCounter = 1;

      if (userId) {
        query += ` WHERE user_id = $${paramCounter++}`;
        params.push(userId);
      }

      query += `
        GROUP BY alert_id
        ORDER BY notification_count DESC, last_notification_at DESC
        LIMIT $${paramCounter}
      `;
      params.push(limit);

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        alertId: row.alert_id,
        notificationCount: parseInt(row.notification_count),
        lastNotificationAt: row.last_notification_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Check if notification is read
   */
  isRead(): boolean {
    return !!this.readAt;
  }

  /**
   * Check if notification is recent (within specified hours)
   */
  isRecent(hours: number = 24): boolean {
    if (!this.deliveredAt) {
      return false;
    }
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.deliveredAt >= cutoffTime;
  }

  /**
   * Get time since delivery
   */
  getTimeSinceDelivery(): string {
    if (!this.deliveredAt) {
      return 'Unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - this.deliveredAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Convert to JSON
   */
  toJSON(): AlertNotificationData {
    return {
      id: this.id,
      alertId: this.alertId,
      userId: this.userId,
      tradeId: this.tradeId,
      notificationType: this.notificationType,
      message: this.message,
      deliveredAt: this.deliveredAt,
      readAt: this.readAt
    };
  }
}