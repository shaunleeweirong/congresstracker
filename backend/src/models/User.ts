import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { PoolClient } from 'pg';

export interface UserData {
  id?: string;
  email: string;
  name?: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subscriptionStatus?: 'active' | 'suspended' | 'cancelled';
  lastLoginAt?: Date;
}

export interface CreateUserData {
  email: string;
  name?: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class User {
  id?: string;
  email: string;
  name?: string;
  private passwordHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  lastLoginAt?: Date;

  constructor(data: UserData) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.passwordHash = data.password; // This will be the hashed password from DB
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.subscriptionStatus = data.subscriptionStatus || 'active';
    this.lastLoginAt = data.lastLoginAt;
  }

  /**
   * Create a new user with hashed password
   */
  static async create(userData: CreateUserData): Promise<User> {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const client = await db.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await User.hashPassword(userData.password);

      // Insert new user
      const result = await client.query(
        `INSERT INTO users (email, name, password_hash, subscription_status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id, email, name, created_at, updated_at, subscription_status, last_login_at`,
        [userData.email, userData.name || null, passwordHash]
      );

      const userRow = result.rows[0];
      return new User({
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
        subscriptionStatus: userRow.subscription_status,
        lastLoginAt: userRow.last_login_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }

    const result = await db.findById('users', id);
    if (!result) {
      return null;
    }

    return new User({
      id: result.id,
      email: result.email,
      name: result.name,
      password: result.password_hash,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      subscriptionStatus: result.subscription_status,
      lastLoginAt: result.last_login_at
    });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const userRow = result.rows[0];
      return new User({
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        password: userRow.password_hash,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
        subscriptionStatus: userRow.subscription_status,
        lastLoginAt: userRow.last_login_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(credentials: LoginCredentials): Promise<User | null> {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    const user = await User.findByEmail(credentials.email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await User.comparePassword(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login timestamp
    await user.updateLastLogin();

    return user;
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token for user
   */
  generateToken(): string {
    if (!this.id) {
      throw new Error('User ID is required to generate token');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const payload: JWTPayload = {
      userId: this.id,
      email: this.email
    };

    return jwt.sign(payload, jwtSecret, {
      expiresIn: '24h',
      issuer: 'congresstracker',
      subject: this.id
    });
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const payload = jwt.verify(token, jwtSecret) as JWTPayload;
      
      if (!payload.userId) {
        return null;
      }

      return User.findById(payload.userId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(): Promise<void> {
    if (!this.id) {
      throw new Error('User ID is required to update last login');
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
        [this.id]
      );
      this.lastLoginAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(updates: { name?: string; email?: string }): Promise<void> {
    if (!this.id) {
      throw new Error('User ID is required to update profile');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCounter++}`);
      values.push(updates.name);
    }

    if (updates.email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error('Invalid email format');
      }

      fields.push(`email = $${paramCounter++}`);
      values.push(updates.email);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(this.id);

    const client = await db.connect();
    try {
      // Check if email is already taken (if updating email)
      if (updates.email && updates.email !== this.email) {
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updates.email, this.id]
        );

        if (existingUser.rows.length > 0) {
          throw new Error('Email is already taken');
        }
      }

      await client.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCounter}`,
        values
      );

      // Update instance properties
      if (updates.name !== undefined) {
        this.name = updates.name;
      }
      if (updates.email !== undefined) {
        this.email = updates.email;
      }
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.id || !this.passwordHash) {
      throw new Error('User must be authenticated to change password');
    }

    // Verify current password
    const isCurrentPasswordValid = await User.comparePassword(currentPassword, this.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Hash new password
    const newPasswordHash = await User.hashPassword(newPassword);

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, this.id]
      );
      this.passwordHash = newPasswordHash;
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(status: 'active' | 'suspended' | 'cancelled'): Promise<void> {
    if (!this.id) {
      throw new Error('User ID is required to update subscription status');
    }

    const client = await db.connect();
    try {
      await client.query(
        'UPDATE users SET subscription_status = $1, updated_at = NOW() WHERE id = $2',
        [status, this.id]
      );
      this.subscriptionStatus = status;
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(): boolean {
    return this.subscriptionStatus === 'active';
  }

  /**
   * Get user's active follows count (for billing)
   */
  async getActiveFollowsCount(): Promise<number> {
    if (!this.id) {
      return 0;
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM user_follows WHERE user_id = $1 AND unfollowed_at IS NULL AND billing_status = $2',
        [this.id, 'active']
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Delete user account (soft delete - deactivate)
   */
  async deactivate(): Promise<void> {
    if (!this.id) {
      throw new Error('User ID is required to deactivate account');
    }

    await this.updateSubscriptionStatus('cancelled');
  }

  /**
   * Convert to JSON (excluding sensitive data)
   */
  toJSON(): Omit<UserData, 'password'> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      subscriptionStatus: this.subscriptionStatus,
      lastLoginAt: this.lastLoginAt
    };
  }

  /**
   * Get all users (admin function)
   */
  static async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      return result.rows.map(row => new User({
        id: row.id,
        email: row.email,
        name: row.name,
        password: row.password_hash,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        subscriptionStatus: row.subscription_status,
        lastLoginAt: row.last_login_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get users by subscription status
   */
  static async findBySubscriptionStatus(status: 'active' | 'suspended' | 'cancelled'): Promise<User[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE subscription_status = $1 ORDER BY created_at DESC',
        [status]
      );

      return result.rows.map(row => new User({
        id: row.id,
        email: row.email,
        name: row.name,
        password: row.password_hash,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        subscriptionStatus: row.subscription_status,
        lastLoginAt: row.last_login_at
      }));
    } finally {
      client.release();
    }
  }
}