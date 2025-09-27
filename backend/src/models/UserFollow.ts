import { db } from '../config/database';
import { PoolClient } from 'pg';

export type TraderType = 'congressional' | 'corporate';
export type BillingStatus = 'active' | 'suspended' | 'cancelled';

export interface UserFollowData {
  id?: string;
  userId: string;
  traderType: TraderType;
  traderId: string;
  followedAt?: Date;
  unfollowedAt?: Date;
  billingStatus?: BillingStatus;
}

export interface CreateUserFollowData {
  userId: string;
  traderType: TraderType;
  traderId: string;
  billingStatus?: BillingStatus;
}

export interface UserFollowFilters {
  userId?: string;
  traderType?: TraderType;
  traderId?: string;
  billingStatus?: BillingStatus;
  isActive?: boolean;
}

export interface FollowWithTrader extends UserFollowData {
  trader?: {
    id: string;
    name: string;
    position?: string;
    stateCode?: string;
    district?: number;
    partyAffiliation?: string;
    companyName?: string;
  };
}

export interface BillingReport {
  userId: string;
  userName?: string;
  userEmail?: string;
  activeFollows: number;
  monthlyBillableUnits: number;
  followDetails: Array<{
    traderId: string;
    traderType: TraderType;
    traderName: string;
    followedAt: Date;
    billingStatus: BillingStatus;
  }>;
}

export class UserFollow {
  id?: string;
  userId: string;
  traderType: TraderType;
  traderId: string;
  followedAt?: Date;
  unfollowedAt?: Date;
  billingStatus: BillingStatus;

  constructor(data: UserFollowData) {
    this.id = data.id;
    this.userId = data.userId;
    this.traderType = data.traderType;
    this.traderId = data.traderId;
    this.followedAt = data.followedAt;
    this.unfollowedAt = data.unfollowedAt;
    this.billingStatus = data.billingStatus || 'active';
  }

  /**
   * Create a new user follow relationship
   */
  static async create(followData: CreateUserFollowData): Promise<UserFollow> {
    // Validate required fields
    if (!followData.userId || !followData.traderType || !followData.traderId) {
      throw new Error('User ID, trader type, and trader ID are required');
    }

    // Validate trader type
    if (!['congressional', 'corporate'].includes(followData.traderType)) {
      throw new Error('Trader type must be either "congressional" or "corporate"');
    }

    const client = await db.connect();
    try {
      // Verify user exists and has active subscription
      const user = await client.query(
        'SELECT id, subscription_status FROM users WHERE id = $1',
        [followData.userId]
      );

      if (user.rows.length === 0) {
        throw new Error('User does not exist');
      }

      if (user.rows[0].subscription_status !== 'active') {
        throw new Error('User must have an active subscription to follow traders');
      }

      // Verify trader exists
      await UserFollow.validateTraderExists(client, followData.traderType, followData.traderId);

      // Check if follow relationship already exists (active)
      const existingFollow = await client.query(
        `SELECT id FROM user_follows 
         WHERE user_id = $1 AND trader_type = $2 AND trader_id = $3 AND unfollowed_at IS NULL`,
        [followData.userId, followData.traderType, followData.traderId]
      );

      if (existingFollow.rows.length > 0) {
        throw new Error('User is already following this trader');
      }

      // Insert new user follow
      const result = await client.query(
        `INSERT INTO user_follows 
         (user_id, trader_type, trader_id, billing_status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          followData.userId,
          followData.traderType,
          followData.traderId,
          followData.billingStatus || 'active'
        ]
      );

      const followRow = result.rows[0];
      return new UserFollow({
        id: followRow.id,
        userId: followRow.user_id,
        traderType: followRow.trader_type,
        traderId: followRow.trader_id,
        followedAt: followRow.followed_at,
        unfollowedAt: followRow.unfollowed_at,
        billingStatus: followRow.billing_status
      });
    } finally {
      client.release();
    }
  }

  /**
   * Validate that trader exists
   */
  private static async validateTraderExists(
    client: PoolClient,
    traderType: TraderType,
    traderId: string
  ): Promise<void> {
    let tableName: string;
    
    switch (traderType) {
      case 'congressional':
        tableName = 'congressional_members';
        break;
      case 'corporate':
        tableName = 'corporate_insiders';
        break;
      default:
        throw new Error(`Invalid trader type: ${traderType}`);
    }

    const result = await client.query(
      `SELECT id FROM ${tableName} WHERE id = $1`,
      [traderId]
    );

    if (result.rows.length === 0) {
      throw new Error(`${traderType} trader with ID ${traderId} does not exist`);
    }
  }

  /**
   * Find user follow by ID
   */
  static async findById(id: string): Promise<UserFollow | null> {
    if (!id) {
      return null;
    }

    const result = await db.findById('user_follows', id);
    if (!result) {
      return null;
    }

    return new UserFollow({
      id: result.id,
      userId: result.user_id,
      traderType: result.trader_type,
      traderId: result.trader_id,
      followedAt: result.followed_at,
      unfollowedAt: result.unfollowed_at,
      billingStatus: result.billing_status
    });
  }

  /**
   * Find follows with trader details
   */
  static async findWithDetails(
    filters: UserFollowFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<FollowWithTrader[]> {
    const client = await db.connect();
    try {
      let query = `
        SELECT 
          uf.*,
          CASE 
            WHEN uf.trader_type = 'congressional' THEN 
              json_build_object(
                'id', cm.id,
                'name', cm.name,
                'position', cm.position,
                'stateCode', cm.state_code,
                'district', cm.district,
                'partyAffiliation', cm.party_affiliation
              )
            WHEN uf.trader_type = 'corporate' THEN
              json_build_object(
                'id', ci.id,
                'name', ci.name,
                'companyName', ci.company_name,
                'position', ci.position
              )
            ELSE NULL
          END as trader
        FROM user_follows uf
        LEFT JOIN congressional_members cm ON uf.trader_type = 'congressional' AND uf.trader_id = cm.id
        LEFT JOIN corporate_insiders ci ON uf.trader_type = 'corporate' AND uf.trader_id = ci.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCounter = 1;

      // Apply filters
      if (filters.userId) {
        query += ` AND uf.user_id = $${paramCounter++}`;
        params.push(filters.userId);
      }

      if (filters.traderType) {
        query += ` AND uf.trader_type = $${paramCounter++}`;
        params.push(filters.traderType);
      }

      if (filters.traderId) {
        query += ` AND uf.trader_id = $${paramCounter++}`;
        params.push(filters.traderId);
      }

      if (filters.billingStatus) {
        query += ` AND uf.billing_status = $${paramCounter++}`;
        params.push(filters.billingStatus);
      }

      if (filters.isActive === true) {
        query += ' AND uf.unfollowed_at IS NULL';
      } else if (filters.isActive === false) {
        query += ' AND uf.unfollowed_at IS NOT NULL';
      }

      query += ` ORDER BY uf.followed_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        traderType: row.trader_type,
        traderId: row.trader_id,
        followedAt: row.followed_at,
        unfollowedAt: row.unfollowed_at,
        billingStatus: row.billing_status,
        trader: row.trader
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find user's active follows
   */
  static async findUserActiveFollows(userId: string): Promise<FollowWithTrader[]> {
    return UserFollow.findWithDetails({ 
      userId, 
      isActive: true, 
      billingStatus: 'active' 
    });
  }

  /**
   * Check if user is following a trader
   */
  static async isFollowing(
    userId: string,
    traderType: TraderType,
    traderId: string
  ): Promise<boolean> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT id FROM user_follows 
         WHERE user_id = $1 AND trader_type = $2 AND trader_id = $3 
         AND unfollowed_at IS NULL`,
        [userId, traderType, traderId]
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Find existing follow relationship
   */
  static async findFollow(
    userId: string,
    traderType: TraderType,
    traderId: string
  ): Promise<UserFollow | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM user_follows 
         WHERE user_id = $1 AND trader_type = $2 AND trader_id = $3 
         AND unfollowed_at IS NULL`,
        [userId, traderType, traderId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const followRow = result.rows[0];
      return new UserFollow({
        id: followRow.id,
        userId: followRow.user_id,
        traderType: followRow.trader_type,
        traderId: followRow.trader_id,
        followedAt: followRow.followed_at,
        unfollowedAt: followRow.unfollowed_at,
        billingStatus: followRow.billing_status
      });
    } finally {
      client.release();
    }
  }

  /**
   * Unfollow a trader
   */
  async unfollow(): Promise<void> {
    if (!this.id) {
      throw new Error('Follow ID is required to unfollow');
    }

    if (this.unfollowedAt) {
      throw new Error('Already unfollowed');
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE user_follows SET unfollowed_at = NOW() WHERE id = $1',
        [this.id]
      );
      this.unfollowedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Update billing status
   */
  async updateBillingStatus(status: BillingStatus): Promise<void> {
    if (!this.id) {
      throw new Error('Follow ID is required to update billing status');
    }

    if (!['active', 'suspended', 'cancelled'].includes(status)) {
      throw new Error('Invalid billing status');
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE user_follows SET billing_status = $1 WHERE id = $2',
        [status, this.id]
      );
      this.billingStatus = status;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's active follow count for billing
   */
  static async getUserActiveFollowCount(userId: string): Promise<number> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM user_follows 
         WHERE user_id = $1 AND unfollowed_at IS NULL AND billing_status = 'active'`,
        [userId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Get billing report for a user
   */
  static async getUserBillingReport(userId: string): Promise<BillingReport> {
    const client = await db.connect();
    try {
      // Get user info
      const userResult = await client.query(
        'SELECT name, email FROM users WHERE id = $1',
        [userId]
      );

      const user = userResult.rows[0];

      // Get active follows with trader details
      const followsResult = await client.query(`
        SELECT 
          uf.*,
          CASE 
            WHEN uf.trader_type = 'congressional' THEN cm.name
            WHEN uf.trader_type = 'corporate' THEN ci.name
            ELSE 'Unknown'
          END as trader_name
        FROM user_follows uf
        LEFT JOIN congressional_members cm ON uf.trader_type = 'congressional' AND uf.trader_id = cm.id
        LEFT JOIN corporate_insiders ci ON uf.trader_type = 'corporate' AND uf.trader_id = ci.id
        WHERE uf.user_id = $1 AND uf.unfollowed_at IS NULL
        ORDER BY uf.followed_at DESC
      `, [userId]);

      const activeFollows = followsResult.rows.filter(row => row.billing_status === 'active').length;

      return {
        userId,
        userName: user?.name,
        userEmail: user?.email,
        activeFollows,
        monthlyBillableUnits: activeFollows, // 1 unit per active follow
        followDetails: followsResult.rows.map(row => ({
          traderId: row.trader_id,
          traderType: row.trader_type,
          traderName: row.trader_name,
          followedAt: row.followed_at,
          billingStatus: row.billing_status
        }))
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get billing summary for all users
   */
  static async getBillingSummary(): Promise<Array<{
    userId: string;
    userName?: string;
    userEmail?: string;
    activeFollows: number;
    monthlyBillableUnits: number;
  }>> {
    const client = await db.connect();
    try {
      const result = await client.query(`
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          COUNT(uf.id) as active_follows
        FROM users u
        LEFT JOIN user_follows uf ON u.id = uf.user_id 
          AND uf.unfollowed_at IS NULL 
          AND uf.billing_status = 'active'
        WHERE u.subscription_status = 'active'
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(uf.id) > 0
        ORDER BY active_follows DESC, u.name
      `);

      return result.rows.map(row => ({
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        activeFollows: parseInt(row.active_follows),
        monthlyBillableUnits: parseInt(row.active_follows)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get most followed traders
   */
  static async getMostFollowedTraders(limit: number = 20): Promise<Array<{
    traderId: string;
    traderType: TraderType;
    traderName: string;
    followCount: number;
    activeFollowCount: number;
  }>> {
    const client = await db.connect();
    try {
      const result = await client.query(`
        SELECT 
          uf.trader_id,
          uf.trader_type,
          CASE 
            WHEN uf.trader_type = 'congressional' THEN cm.name
            WHEN uf.trader_type = 'corporate' THEN ci.name
            ELSE 'Unknown'
          END as trader_name,
          COUNT(*) as follow_count,
          SUM(CASE WHEN uf.unfollowed_at IS NULL THEN 1 ELSE 0 END) as active_follow_count
        FROM user_follows uf
        LEFT JOIN congressional_members cm ON uf.trader_type = 'congressional' AND uf.trader_id = cm.id
        LEFT JOIN corporate_insiders ci ON uf.trader_type = 'corporate' AND uf.trader_id = ci.id
        GROUP BY uf.trader_id, uf.trader_type, trader_name
        ORDER BY active_follow_count DESC, follow_count DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        traderId: row.trader_id,
        traderType: row.trader_type,
        traderName: row.trader_name,
        followCount: parseInt(row.follow_count),
        activeFollowCount: parseInt(row.active_follow_count)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup inactive follows (billing maintenance)
   */
  static async cleanupInactiveFollows(): Promise<number> {
    const client = await db.connect();
    try {
      // Update follows for users with inactive subscriptions
      const result = await client.query(`
        UPDATE user_follows 
        SET billing_status = 'suspended'
        FROM users 
        WHERE user_follows.user_id = users.id 
        AND users.subscription_status != 'active'
        AND user_follows.billing_status = 'active'
        AND user_follows.unfollowed_at IS NULL
      `);

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk update billing status for users
   */
  static async bulkUpdateBillingStatus(
    userIds: string[],
    status: BillingStatus
  ): Promise<number> {
    if (!userIds || userIds.length === 0) {
      return 0;
    }

    const client = await db.connect();
    try {
      const placeholders = userIds.map((_, index) => `$${index + 2}`).join(',');
      const result = await client.query(
        `UPDATE user_follows 
         SET billing_status = $1 
         WHERE user_id IN (${placeholders}) 
         AND unfollowed_at IS NULL`,
        [status, ...userIds]
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Check if follow is active
   */
  isActive(): boolean {
    return !this.unfollowedAt && this.billingStatus === 'active';
  }

  /**
   * Get follow duration in days
   */
  getFollowDurationDays(): number {
    const endDate = this.unfollowedAt || new Date();
    const startDate = this.followedAt || new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert to JSON
   */
  toJSON(): UserFollowData {
    return {
      id: this.id,
      userId: this.userId,
      traderType: this.traderType,
      traderId: this.traderId,
      followedAt: this.followedAt,
      unfollowedAt: this.unfollowedAt,
      billingStatus: this.billingStatus
    };
  }
}