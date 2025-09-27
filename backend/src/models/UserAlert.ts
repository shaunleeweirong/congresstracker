import { db } from '../config/database';
import { PoolClient } from 'pg';

export type AlertType = 'politician' | 'stock' | 'pattern';
export type AlertStatus = 'active' | 'paused' | 'deleted';

export interface PatternConfig {
  minValue?: number;
  maxValue?: number;
  transactionType?: 'buy' | 'sell' | 'exchange';
  timeFrame?: '1h' | '24h' | '7d' | '30d';
  // Additional pattern criteria can be added here
  keywords?: string[];
  sectors?: string[];
}

export interface UserAlertData {
  id?: string;
  userId: string;
  alertType: AlertType;
  alertStatus?: AlertStatus;
  politicianId?: string;
  tickerSymbol?: string;
  patternConfig?: PatternConfig;
  createdAt?: Date;
  updatedAt?: Date;
  lastTriggeredAt?: Date;
}

export interface CreateUserAlertData {
  userId: string;
  alertType: AlertType;
  alertStatus?: AlertStatus;
  politicianId?: string;
  tickerSymbol?: string;
  patternConfig?: PatternConfig;
}

export interface UserAlertFilters {
  userId?: string;
  alertType?: AlertType;
  alertStatus?: AlertStatus;
  isActive?: boolean;
}

export interface AlertWithDetails extends UserAlertData {
  politician?: {
    id: string;
    name: string;
    position: string;
    stateCode: string;
    district?: number;
    partyAffiliation?: string;
  };
  stock?: {
    symbol: string;
    companyName: string;
    sector?: string;
    lastPrice?: number;
  };
}

export class UserAlert {
  id?: string;
  userId: string;
  alertType: AlertType;
  alertStatus: AlertStatus;
  politicianId?: string;
  tickerSymbol?: string;
  patternConfig?: PatternConfig;
  createdAt?: Date;
  updatedAt?: Date;
  lastTriggeredAt?: Date;

  constructor(data: UserAlertData) {
    this.id = data.id;
    this.userId = data.userId;
    this.alertType = data.alertType;
    this.alertStatus = data.alertStatus || 'active';
    this.politicianId = data.politicianId;
    this.tickerSymbol = data.tickerSymbol?.toUpperCase();
    this.patternConfig = data.patternConfig;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastTriggeredAt = data.lastTriggeredAt;
  }

  /**
   * Create a new user alert
   */
  static async create(alertData: CreateUserAlertData): Promise<UserAlert> {
    // Validate required fields
    if (!alertData.userId || !alertData.alertType) {
      throw new Error('User ID and alert type are required');
    }

    // Validate alert type
    if (!['politician', 'stock', 'pattern'].includes(alertData.alertType)) {
      throw new Error('Alert type must be "politician", "stock", or "pattern"');
    }

    // Validate type-specific requirements
    await UserAlert.validateAlertData(alertData);

    const client = await db.connect();
    try {
      // Verify user exists
      const userExists = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [alertData.userId]
      );

      if (userExists.rows.length === 0) {
        throw new Error('User does not exist');
      }

      // Validate type-specific entities exist
      await UserAlert.validateEntityExists(client, alertData);

      // Insert new user alert
      const result = await client.query(
        `INSERT INTO user_alerts 
         (user_id, alert_type, alert_status, politician_id, ticker_symbol, pattern_config)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          alertData.userId,
          alertData.alertType,
          alertData.alertStatus || 'active',
          alertData.politicianId || null,
          alertData.tickerSymbol?.toUpperCase() || null,
          alertData.patternConfig ? JSON.stringify(alertData.patternConfig) : null
        ]
      );

      const alertRow = result.rows[0];
      return new UserAlert({
        id: alertRow.id,
        userId: alertRow.user_id,
        alertType: alertRow.alert_type,
        alertStatus: alertRow.alert_status,
        politicianId: alertRow.politician_id,
        tickerSymbol: alertRow.ticker_symbol,
        patternConfig: alertRow.pattern_config,
        createdAt: alertRow.created_at,
        updatedAt: alertRow.updated_at,
        lastTriggeredAt: alertRow.last_triggered_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Validate alert data based on type
   */
  private static async validateAlertData(alertData: CreateUserAlertData): Promise<void> {
    switch (alertData.alertType) {
      case 'politician':
        if (!alertData.politicianId) {
          throw new Error('Politician ID is required for politician alerts');
        }
        if (alertData.tickerSymbol || alertData.patternConfig) {
          throw new Error('Politician alerts cannot have ticker symbol or pattern config');
        }
        break;

      case 'stock':
        if (!alertData.tickerSymbol) {
          throw new Error('Ticker symbol is required for stock alerts');
        }
        if (alertData.politicianId || alertData.patternConfig) {
          throw new Error('Stock alerts cannot have politician ID or pattern config');
        }
        break;

      case 'pattern':
        if (!alertData.patternConfig) {
          throw new Error('Pattern config is required for pattern alerts');
        }
        if (alertData.politicianId || alertData.tickerSymbol) {
          throw new Error('Pattern alerts cannot have politician ID or ticker symbol');
        }
        // Validate pattern config
        UserAlert.validatePatternConfig(alertData.patternConfig);
        break;

      default:
        throw new Error(`Invalid alert type: ${alertData.alertType}`);
    }
  }

  /**
   * Validate pattern configuration
   */
  private static validatePatternConfig(config: PatternConfig): void {
    if (config.minValue !== undefined && config.minValue < 0) {
      throw new Error('Minimum value cannot be negative');
    }

    if (config.maxValue !== undefined && config.maxValue < 0) {
      throw new Error('Maximum value cannot be negative');
    }

    if (config.minValue !== undefined && config.maxValue !== undefined && 
        config.minValue > config.maxValue) {
      throw new Error('Minimum value cannot be greater than maximum value');
    }

    if (config.transactionType && !['buy', 'sell', 'exchange'].includes(config.transactionType)) {
      throw new Error('Transaction type must be "buy", "sell", or "exchange"');
    }

    if (config.timeFrame && !['1h', '24h', '7d', '30d'].includes(config.timeFrame)) {
      throw new Error('Time frame must be "1h", "24h", "7d", or "30d"');
    }
  }

  /**
   * Validate that referenced entities exist
   */
  private static async validateEntityExists(
    client: PoolClient,
    alertData: CreateUserAlertData
  ): Promise<void> {
    if (alertData.politicianId) {
      const politician = await client.query(
        'SELECT id FROM congressional_members WHERE id = $1',
        [alertData.politicianId]
      );

      if (politician.rows.length === 0) {
        throw new Error('Politician does not exist');
      }
    }

    if (alertData.tickerSymbol) {
      const ticker = await client.query(
        'SELECT symbol FROM stock_tickers WHERE symbol = $1',
        [alertData.tickerSymbol.toUpperCase()]
      );

      if (ticker.rows.length === 0) {
        throw new Error('Stock ticker does not exist');
      }
    }
  }

  /**
   * Find user alert by ID
   */
  static async findById(id: string): Promise<UserAlert | null> {
    if (!id) {
      return null;
    }

    const result = await db.findById('user_alerts', id);
    if (!result) {
      return null;
    }

    return new UserAlert({
      id: result.id,
      userId: result.user_id,
      alertType: result.alert_type,
      alertStatus: result.alert_status,
      politicianId: result.politician_id,
      tickerSymbol: result.ticker_symbol,
      patternConfig: result.pattern_config,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      lastTriggeredAt: result.last_triggered_at
    });
  }

  /**
   * Find alerts with details (including politician/stock info)
   */
  static async findWithDetails(
    filters: UserAlertFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<AlertWithDetails[]> {
    const client = await db.connect();
    try {
      let query = `
        SELECT 
          ua.*,
          CASE 
            WHEN ua.politician_id IS NOT NULL THEN 
              json_build_object(
                'id', cm.id,
                'name', cm.name,
                'position', cm.position,
                'stateCode', cm.state_code,
                'district', cm.district,
                'partyAffiliation', cm.party_affiliation
              )
            ELSE NULL
          END as politician,
          CASE 
            WHEN ua.ticker_symbol IS NOT NULL THEN
              json_build_object(
                'symbol', st.symbol,
                'companyName', st.company_name,
                'sector', st.sector,
                'lastPrice', st.last_price
              )
            ELSE NULL
          END as stock
        FROM user_alerts ua
        LEFT JOIN congressional_members cm ON ua.politician_id = cm.id
        LEFT JOIN stock_tickers st ON ua.ticker_symbol = st.symbol
        WHERE ua.alert_status != 'deleted'
      `;

      const params: any[] = [];
      let paramCounter = 1;

      // Apply filters
      if (filters.userId) {
        query += ` AND ua.user_id = $${paramCounter++}`;
        params.push(filters.userId);
      }

      if (filters.alertType) {
        query += ` AND ua.alert_type = $${paramCounter++}`;
        params.push(filters.alertType);
      }

      if (filters.alertStatus) {
        query += ` AND ua.alert_status = $${paramCounter++}`;
        params.push(filters.alertStatus);
      }

      if (filters.isActive === true) {
        query += ' AND ua.alert_status = \'active\'';
      }

      query += ` ORDER BY ua.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        alertType: row.alert_type,
        alertStatus: row.alert_status,
        politicianId: row.politician_id,
        tickerSymbol: row.ticker_symbol,
        patternConfig: row.pattern_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastTriggeredAt: row.last_triggered_at,
        politician: row.politician,
        stock: row.stock
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find alerts by user
   */
  static async findByUser(
    userId: string,
    includeInactive: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<AlertWithDetails[]> {
    const filters: UserAlertFilters = { userId };
    if (!includeInactive) {
      filters.isActive = true;
    }

    return UserAlert.findWithDetails(filters, limit, offset);
  }

  /**
   * Find active alerts that could be triggered by a trade
   */
  static async findTriggerable(
    tradeData: {
      traderId: string;
      traderType: 'congressional' | 'corporate';
      tickerSymbol: string;
      transactionType: 'buy' | 'sell' | 'exchange';
      estimatedValue?: number;
    }
  ): Promise<UserAlert[]> {
    const client = await db.connect();
    try {
      let query = `
        SELECT * FROM user_alerts 
        WHERE alert_status = 'active' AND (
      `;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramCounter = 1;

      // Politician alerts
      if (tradeData.traderType === 'congressional') {
        conditions.push(`(alert_type = 'politician' AND politician_id = $${paramCounter++})`);
        params.push(tradeData.traderId);
      }

      // Stock alerts
      conditions.push(`(alert_type = 'stock' AND ticker_symbol = $${paramCounter++})`);
      params.push(tradeData.tickerSymbol.toUpperCase());

      // Pattern alerts
      let patternCondition = `(alert_type = 'pattern'`;
      
      if (tradeData.estimatedValue !== undefined) {
        patternCondition += ` AND (
          pattern_config->>'minValue' IS NULL OR 
          (pattern_config->>'minValue')::numeric <= $${paramCounter++}
        ) AND (
          pattern_config->>'maxValue' IS NULL OR 
          (pattern_config->>'maxValue')::numeric >= $${paramCounter++}
        )`;
        params.push(tradeData.estimatedValue, tradeData.estimatedValue);
      }

      patternCondition += ` AND (
        pattern_config->>'transactionType' IS NULL OR 
        pattern_config->>'transactionType' = $${paramCounter++}
      ))`;
      params.push(tradeData.transactionType);

      conditions.push(patternCondition);

      query += conditions.join(' OR ') + ')';

      const result = await client.query(query, params);

      return result.rows.map(row => new UserAlert({
        id: row.id,
        userId: row.user_id,
        alertType: row.alert_type,
        alertStatus: row.alert_status,
        politicianId: row.politician_id,
        tickerSymbol: row.ticker_symbol,
        patternConfig: row.pattern_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastTriggeredAt: row.last_triggered_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Update alert
   */
  async update(updates: Partial<CreateUserAlertData>): Promise<void> {
    if (!this.id) {
      throw new Error('Alert ID is required to update');
    }

    // Validate updates
    if (updates.alertType && updates.alertType !== this.alertType) {
      throw new Error('Alert type cannot be changed');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (updates.alertStatus) {
      if (!['active', 'paused', 'deleted'].includes(updates.alertStatus)) {
        throw new Error('Invalid alert status');
      }
      fields.push(`alert_status = $${paramCounter++}`);
      values.push(updates.alertStatus);
    }

    if (updates.politicianId !== undefined) {
      if (this.alertType !== 'politician') {
        throw new Error('Cannot set politician ID for non-politician alerts');
      }
      fields.push(`politician_id = $${paramCounter++}`);
      values.push(updates.politicianId);
    }

    if (updates.tickerSymbol !== undefined) {
      if (this.alertType !== 'stock') {
        throw new Error('Cannot set ticker symbol for non-stock alerts');
      }
      fields.push(`ticker_symbol = $${paramCounter++}`);
      values.push(updates.tickerSymbol?.toUpperCase() || null);
    }

    if (updates.patternConfig !== undefined) {
      if (this.alertType !== 'pattern') {
        throw new Error('Cannot set pattern config for non-pattern alerts');
      }
      if (updates.patternConfig) {
        UserAlert.validatePatternConfig(updates.patternConfig);
      }
      fields.push(`pattern_config = $${paramCounter++}`);
      values.push(updates.patternConfig ? JSON.stringify(updates.patternConfig) : null);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(this.id);

    const client = await db.connect();
    try {
      await client.query(
        `UPDATE user_alerts SET ${fields.join(', ')} WHERE id = $${paramCounter}`,
        values
      );

      // Update instance properties
      if (updates.alertStatus) this.alertStatus = updates.alertStatus;
      if (updates.politicianId !== undefined) this.politicianId = updates.politicianId;
      if (updates.tickerSymbol !== undefined) this.tickerSymbol = updates.tickerSymbol?.toUpperCase();
      if (updates.patternConfig !== undefined) this.patternConfig = updates.patternConfig;
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Pause alert
   */
  async pause(): Promise<void> {
    await this.update({ alertStatus: 'paused' });
  }

  /**
   * Resume alert
   */
  async resume(): Promise<void> {
    await this.update({ alertStatus: 'active' });
  }

  /**
   * Delete alert (soft delete)
   */
  async delete(): Promise<void> {
    await this.update({ alertStatus: 'deleted' });
  }

  /**
   * Mark alert as triggered
   */
  async markTriggered(): Promise<void> {
    if (!this.id) {
      throw new Error('Alert ID is required to mark as triggered');
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE user_alerts SET last_triggered_at = NOW(), updated_at = NOW() WHERE id = $1',
        [this.id]
      );
      this.lastTriggeredAt = new Date();
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Check if alert should trigger for a trade
   */
  shouldTrigger(tradeData: {
    traderId: string;
    traderType: 'congressional' | 'corporate';
    tickerSymbol: string;
    transactionType: 'buy' | 'sell' | 'exchange';
    estimatedValue?: number;
    transactionDate: Date;
  }): boolean {
    if (this.alertStatus !== 'active') {
      return false;
    }

    switch (this.alertType) {
      case 'politician':
        return tradeData.traderType === 'congressional' && 
               tradeData.traderId === this.politicianId;

      case 'stock':
        return tradeData.tickerSymbol.toUpperCase() === this.tickerSymbol;

      case 'pattern':
        return this.matchesPattern(tradeData);

      default:
        return false;
    }
  }

  /**
   * Check if trade matches pattern criteria
   */
  private matchesPattern(tradeData: {
    transactionType: 'buy' | 'sell' | 'exchange';
    estimatedValue?: number;
    transactionDate: Date;
  }): boolean {
    if (!this.patternConfig) {
      return false;
    }

    const config = this.patternConfig;

    // Check transaction type
    if (config.transactionType && config.transactionType !== tradeData.transactionType) {
      return false;
    }

    // Check value range
    if (tradeData.estimatedValue !== undefined) {
      if (config.minValue !== undefined && tradeData.estimatedValue < config.minValue) {
        return false;
      }
      if (config.maxValue !== undefined && tradeData.estimatedValue > config.maxValue) {
        return false;
      }
    }

    // Check time frame
    if (config.timeFrame) {
      const now = new Date();
      const timeFrameMs = this.getTimeFrameMs(config.timeFrame);
      const cutoffTime = new Date(now.getTime() - timeFrameMs);
      
      if (tradeData.transactionDate < cutoffTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert time frame to milliseconds
   */
  private getTimeFrameMs(timeFrame: string): number {
    switch (timeFrame) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24h
    }
  }

  /**
   * Get alert description for display
   */
  getDescription(): string {
    switch (this.alertType) {
      case 'politician':
        return `Alert for politician ID: ${this.politicianId}`;
      case 'stock':
        return `Alert for stock: ${this.tickerSymbol}`;
      case 'pattern':
        return this.getPatternDescription();
      default:
        return 'Unknown alert type';
    }
  }

  /**
   * Get pattern description
   */
  private getPatternDescription(): string {
    if (!this.patternConfig) {
      return 'Pattern alert with no configuration';
    }

    const parts: string[] = [];
    const config = this.patternConfig;

    if (config.transactionType) {
      parts.push(`${config.transactionType} transactions`);
    }

    if (config.minValue !== undefined || config.maxValue !== undefined) {
      if (config.minValue !== undefined && config.maxValue !== undefined) {
        parts.push(`value between $${config.minValue.toLocaleString()} and $${config.maxValue.toLocaleString()}`);
      } else if (config.minValue !== undefined) {
        parts.push(`value >= $${config.minValue.toLocaleString()}`);
      } else {
        parts.push(`value <= $${config.maxValue!.toLocaleString()}`);
      }
    }

    if (config.timeFrame) {
      parts.push(`within ${config.timeFrame}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Pattern alert';
  }

  /**
   * Check if alert is active
   */
  isActive(): boolean {
    return this.alertStatus === 'active';
  }

  /**
   * Get user's alert count by type
   */
  static async getUserAlertCounts(userId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    politician: number;
    stock: number;
    pattern: number;
  }> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN alert_status = 'active' THEN 1 ELSE 0 END) as active,
           SUM(CASE WHEN alert_status = 'paused' THEN 1 ELSE 0 END) as paused,
           SUM(CASE WHEN alert_type = 'politician' THEN 1 ELSE 0 END) as politician,
           SUM(CASE WHEN alert_type = 'stock' THEN 1 ELSE 0 END) as stock,
           SUM(CASE WHEN alert_type = 'pattern' THEN 1 ELSE 0 END) as pattern
         FROM user_alerts 
         WHERE user_id = $1 AND alert_status != 'deleted'`,
        [userId]
      );

      const counts = result.rows[0];
      return {
        total: parseInt(counts.total) || 0,
        active: parseInt(counts.active) || 0,
        paused: parseInt(counts.paused) || 0,
        politician: parseInt(counts.politician) || 0,
        stock: parseInt(counts.stock) || 0,
        pattern: parseInt(counts.pattern) || 0
      };
    } finally {
      client.release();
    }
  }

  /**
   * Convert to JSON
   */
  toJSON(): UserAlertData {
    return {
      id: this.id,
      userId: this.userId,
      alertType: this.alertType,
      alertStatus: this.alertStatus,
      politicianId: this.politicianId,
      tickerSymbol: this.tickerSymbol,
      patternConfig: this.patternConfig,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastTriggeredAt: this.lastTriggeredAt
    };
  }
}