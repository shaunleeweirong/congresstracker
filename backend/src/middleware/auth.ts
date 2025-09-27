import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware that verifies JWT tokens
 * Adds user information to request object if valid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization header',
        code: 'AUTH_TOKEN_MISSING'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Token not provided',
        code: 'AUTH_TOKEN_MISSING'
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication service unavailable',
        code: 'AUTH_CONFIG_ERROR'
      });
      return;
    }

    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({
          error: 'Token expired',
          message: 'Authentication token has expired',
          code: 'AUTH_TOKEN_EXPIRED'
        });
        return;
      } else if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Authentication token is invalid',
          code: 'AUTH_TOKEN_INVALID'
        });
        return;
      } else {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Token verification failed',
          code: 'AUTH_TOKEN_ERROR'
        });
        return;
      }
    }

    // Validate payload structure
    if (!payload.userId || !payload.email) {
      res.status(401).json({
        error: 'Invalid token payload',
        message: 'Token contains invalid user information',
        code: 'AUTH_TOKEN_INVALID_PAYLOAD'
      });
      return;
    }

    // Look up user in database
    const user = await User.findById(payload.userId);
    
    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authentication token refers to non-existent user',
        code: 'AUTH_USER_NOT_FOUND'
      });
      return;
    }

    // Check if user account is active
    if (!user.hasActiveSubscription()) {
      res.status(401).json({
        error: 'Account suspended',
        message: 'User account is not active',
        code: 'AUTH_ACCOUNT_SUSPENDED'
      });
      return;
    }

    // Add user information to request
    req.user = user;
    req.userId = user.id!;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication service error',
      message: 'An error occurred during authentication',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user information if token is valid, but doesn't require authentication
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as JWTPayload;
      
      if (payload.userId && payload.email) {
        const user = await User.findById(payload.userId);
        if (user && user.hasActiveSubscription()) {
          req.user = user;
          req.userId = user.id!;
        }
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional authentication
    }

    next();
  } catch (error) {
    // Don't fail on optional authentication errors
    next();
  }
};

/**
 * Middleware to require specific subscription status
 */
export const requireSubscription = (
  requiredStatus: 'active' | 'suspended' | 'cancelled' = 'active'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires authentication',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (req.user.subscriptionStatus !== requiredStatus) {
      res.status(403).json({
        error: 'Subscription required',
        message: `This endpoint requires ${requiredStatus} subscription status`,
        code: 'SUBSCRIPTION_REQUIRED',
        currentStatus: req.user.subscriptionStatus
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has billing privileges (for admin functions)
 */
export const requireBillingAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'This endpoint requires authentication',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  // Check if user is admin (you might have an isAdmin field)
  // For now, check if user has any active follows (basic billing access)
  try {
    const followCount = await req.user.getActiveFollowsCount();
    
    // Allow access if user has billing activity or is admin
    // This is a placeholder - you might want different logic
    if (followCount >= 0) { // All authenticated users can access for now
      return next();
    }

    res.status(403).json({
      error: 'Insufficient privileges',
      message: 'This endpoint requires billing access',
      code: 'BILLING_ACCESS_REQUIRED'
    });
  } catch (error) {
    console.error('Billing access check error:', error);
    res.status(500).json({
      error: 'Authorization service error',
      message: 'An error occurred during authorization check',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Middleware to validate user owns a resource
 * Used for endpoints where users should only access their own data
 */
export const requireResourceOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires authentication',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam] || req.query[userIdParam];
    
    if (!resourceUserId) {
      res.status(400).json({
        error: 'Invalid request',
        message: `Missing ${userIdParam} parameter`,
        code: 'MISSING_USER_ID'
      });
      return;
    }

    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
        code: 'RESOURCE_ACCESS_DENIED'
      });
      return;
    }

    next();
  };
};

/**
 * Utility function to extract user ID from token without full authentication
 * Useful for logging and analytics
 */
export const extractUserIdFromToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!token) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JWTPayload;
    return payload.userId || null;
  } catch {
    return null;
  }
};

/**
 * Middleware to refresh user's last login timestamp
 * Should be used sparingly to avoid database overhead
 */
export const updateLastLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user) {
    try {
      // Update last login asynchronously without blocking request
      setImmediate(async () => {
        try {
          await req.user!.updateLastLogin();
        } catch (error) {
          console.error('Failed to update last login:', error);
        }
      });
    } catch (error) {
      // Don't fail the request if last login update fails
      console.error('Last login update setup error:', error);
    }
  }
  next();
};

export default {
  authenticate,
  optionalAuthenticate,
  requireSubscription,
  requireBillingAccess,
  requireResourceOwnership,
  extractUserIdFromToken,
  updateLastLogin
};