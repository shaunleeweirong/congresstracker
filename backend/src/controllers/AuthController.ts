import { Request, Response } from 'express';
import { AuthService, PasswordResetRequest, PasswordResetData, ProfileUpdateData, PasswordChangeData } from '../services/AuthService';
import { CreateUserData, LoginCredentials } from '../models/User';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const userData: CreateUserData = {
        email: email.toLowerCase().trim(),
        name: name?.trim(),
        password
      };

      const result = await AuthService.register(userData);

      if (!result.success) {
        const statusCode = result.error?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: result.user?.toJSON(),
          token: result.token
        }
      });
    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during registration'
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const credentials: LoginCredentials = {
        email: email.toLowerCase().trim(),
        password
      };

      const result = await AuthService.login(credentials);

      if (!result.success) {
        const statusCode = result.error?.includes('suspended') ? 403 : 401;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: result.user?.toJSON(),
          token: result.token
        }
      });
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login'
      });
    }
  }

  /**
   * Verify JWT token and return user info
   */
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided'
        });
        return;
      }

      const result = await AuthService.verifyToken(token);

      if (!result.success) {
        const statusCode = result.error?.includes('expired') ? 401 : 403;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: result.user?.toJSON()
        }
      });
    } catch (error) {
      console.error('Token verification controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during token verification'
      });
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      const resetRequest: PasswordResetRequest = {
        email: email.toLowerCase().trim()
      };

      const result = await AuthService.requestPasswordReset(resetRequest);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    } catch (error) {
      console.error('Password reset request controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during password reset request'
      });
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Token and new password are required'
        });
        return;
      }

      const resetData: PasswordResetData = {
        token,
        newPassword
      };

      const result = await AuthService.resetPassword(resetData);

      if (!result.success) {
        const statusCode = result.error?.includes('Invalid or expired') ? 401 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Password reset controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during password reset'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { name, email } = req.body;
      const updateData: ProfileUpdateData = {};

      if (name !== undefined) {
        updateData.name = name?.trim();
      }
      if (email !== undefined) {
        updateData.email = email?.toLowerCase().trim();
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No update data provided'
        });
        return;
      }

      const result = await AuthService.updateProfile(userId, updateData);

      if (!result.success) {
        const statusCode = result.error?.includes('already in use') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: result.user?.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during profile update'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
        return;
      }

      const passwordData: PasswordChangeData = {
        currentPassword,
        newPassword
      };

      const result = await AuthService.changePassword(userId, passwordData);

      if (!result.success) {
        const statusCode = result.error?.includes('incorrect') ? 401 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during password change'
      });
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const result = await AuthService.deactivateAccount(userId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate account controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during account deactivation'
      });
    }
  }
}

export default AuthController;