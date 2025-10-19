import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, CreateUserData, LoginCredentials, JWTPayload } from '../models/User';

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly RESET_TOKEN_EXPIRES_IN = '1h';

  /**
   * Register a new user with email and password
   */
  static async register(userData: CreateUserData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email address already exists'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error || 'Password validation failed'
        };
      }

      // Hash the password
      const passwordHash = await this.hashPassword(userData.password);

      // Create user
      const user = await User.create({
        ...userData,
        password: passwordHash
      });

      if (!user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Generate JWT token
      const token = this.generateAccessToken(user);

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Use the existing authenticate method from User model
      const user = await User.authenticate(credentials);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check account status
      if (user.subscriptionStatus === 'suspended') {
        return {
          success: false,
          error: 'Your account has been suspended. Please contact support.'
        };
      }

      // Generate JWT token
      const token = this.generateAccessToken(user);

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token: string): Promise<AuthResult> {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify token
      const payload = jwt.verify(token, jwtSecret) as JWTPayload;
      
      // Find user
      const user = await User.findById(payload.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check account status
      if (user.subscriptionStatus === 'suspended') {
        return {
          success: false,
          error: 'Account suspended'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          error: 'Token expired'
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          error: 'Invalid token'
        };
      }

      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Token verification failed'
      };
    }
  }

  /**
   * Request password reset - generates reset token
   */
  static async requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findByEmail(data.email);
      if (!user) {
        // Don't reveal whether email exists for security
        return { success: true };
      }

      // Generate reset token
      const resetToken = this.generateResetToken(user);
      
      // Store reset token (in a real app, you'd store this in DB with expiration)
      // For now, we'll just log it (in production, you'd send via email)
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
      
      // TODO: Send email with reset link
      // await EmailService.sendPasswordResetEmail(user.email, resetToken);

      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Failed to process password reset request'
      };
    }
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify reset token
      const payload = this.verifyResetToken(data.token);
      if (!payload) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        };
      }

      // Find user
      const user = await User.findById(payload.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error || 'Password validation failed'
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(data.newPassword);

      // Update password by calling updateProfile with a custom password update
      const { db } = await import('../config/database');
      const client = await db.getClient();
      try {
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, user.id]
        );
      } finally {
        client.release();
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Failed to reset password'
      };
    }
  }

  /**
   * Update user profile information
   */
  static async updateProfile(userId: string, data: ProfileUpdateData): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if email is being changed and if it already exists
      if (data.email && data.email !== user.email) {
        const existingUser = await User.findByEmail(data.email);
        if (existingUser) {
          return {
            success: false,
            error: 'Email address is already in use'
          };
        }
      }

      // Update profile
      await user.updateProfile(data);

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, data: PasswordChangeData): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify current password - we need to get the hash from the user
      const userWithHash = await User.findById(userId);
      if (!userWithHash) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      const isCurrentPasswordValid = await User.comparePassword(data.currentPassword, (userWithHash as any).passwordHash || '');
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error || 'Password validation failed'
        };
      }

      // Check if new password is different from current
      const isSamePassword = await User.comparePassword(data.newPassword, (userWithHash as any).passwordHash || '');
      if (isSamePassword) {
        return {
          success: false,
          error: 'New password must be different from current password'
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(data.newPassword);

      // Update password by calling updateProfile with a custom password update
      const { db } = await import('../config/database');
      const client = await db.getClient();
      try {
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, user.id]
        );
      } finally {
        client.release();
      }

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Failed to change password'
      };
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Cancel subscription
      await user.updateSubscriptionStatus('cancelled');

      return { success: true };
    } catch (error) {
      console.error('Account deactivation error:', error);
      return {
        success: false,
        error: 'Failed to deactivate account'
      };
    }
  }

  /**
   * Hash password using bcrypt
   */
  private static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }


  /**
   * Generate JWT access token
   */
  private static generateAccessToken(user: User): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload: JWTPayload = {
      userId: user.id!,
      email: user.email
    };

    return jwt.sign(payload, jwtSecret, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  /**
   * Generate password reset token
   */
  private static generateResetToken(user: User): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id!,
      email: user.email,
      type: 'password_reset'
    };

    return jwt.sign(payload, jwtSecret, {
      expiresIn: this.RESET_TOKEN_EXPIRES_IN
    });
  }

  /**
   * Verify reset token
   */
  private static verifyResetToken(token: string): any {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const payload = jwt.verify(token, jwtSecret) as any;
      
      // Check if it's a reset token
      if (payload.type !== 'password_reset') {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return {
        isValid: false,
        error: 'Password is required'
      };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        error: 'Password must be less than 128 characters long'
      };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter'
      };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter'
      };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number'
      };
    }

    return { isValid: true };
  }
}

export default AuthService;