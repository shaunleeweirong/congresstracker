import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import { RateLimitError } from './errors';

/**
 * Custom rate limit store interface
 * Could be extended to use Redis for distributed rate limiting
 */
interface RateLimitStore {
  incr(key: string, cb: (err?: Error, total?: number) => void): void;
  decrement(key: string): void;
  resetKey(key: string): void;
}

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig extends Partial<Options> {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Create a custom key generator that considers user authentication
 */
const createKeyGenerator = (includeUserId: boolean = false) => {
  return (req: Request): string => {
    if (includeUserId && req.user?.id) {
      return `user:${req.user.id}`;
    }
    
    // Use IP address for unauthenticated requests
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return `ip:${ip}`;
  };
};

/**
 * Custom rate limit handler
 */
const rateLimitHandler = (message: string) => {
  return (req: Request, res: Response): void => {
    throw new RateLimitError(message);
  };
};

/**
 * Skip successful requests for certain endpoints
 */
const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  return res.statusCode < 400;
};

/**
 * Default rate limit configurations
 */
const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

/**
 * Rate limiting configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // General API rate limit
  general: {
    ...defaultConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many API requests, please try again later'
  },

  // Authentication endpoints (more restrictive)
  auth: {
    ...defaultConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true // Only count failed attempts
  },

  // Registration endpoint
  register: {
    ...defaultConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: 'Too many registration attempts, please try again later'
  },

  // Password reset
  passwordReset: {
    ...defaultConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later'
  },

  // Search endpoints
  search: {
    ...defaultConfig,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: 'Too many search requests, please slow down'
  },

  // Data retrieval endpoints (moderate)
  data: {
    ...defaultConfig,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many data requests, please slow down'
  },

  // Data modification endpoints (more restrictive)
  modify: {
    ...defaultConfig,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 modifications per minute
    message: 'Too many modification requests, please slow down'
  },

  // Alert creation (prevent spam)
  alerts: {
    ...defaultConfig,
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 alert operations per 5 minutes
    message: 'Too many alert operations, please wait before creating more alerts'
  },

  // Follow operations (billing related)
  follows: {
    ...defaultConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 follow operations per 15 minutes
    message: 'Too many follow operations, please wait before making more changes'
  },

  // Admin operations (very restrictive)
  admin: {
    ...defaultConfig,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 admin operations per minute
    message: 'Too many admin operations, please slow down'
  },

  // Public endpoints (less restrictive)
  public: {
    ...defaultConfig,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please slow down'
  }
};

/**
 * Create rate limiter with custom configuration
 */
const createRateLimiter = (
  config: RateLimitConfig,
  useUserKey: boolean = false
): RateLimitRequestHandler => {
  return rateLimit({
    ...config,
    keyGenerator: createKeyGenerator(useUserKey),
    // Replace deprecated onLimitReached with handler (express-rate-limit v7+)
    handler: (req: Request, res: Response, next, options: Options) => {
      // Log only when limit is FIRST exceeded (not on every subsequent request)
      if (req.rateLimit.used === req.rateLimit.limit + 1) {
        const userId = req.user?.id;
        const ip = req.ip;
        console.warn(`Rate limit exceeded for ${userId ? `user ${userId}` : `IP ${ip}`} on ${req.path}`);
      }
      // Send the rate limit error response
      throw new RateLimitError(config.message || defaultConfig.message!);
    },
    standardHeaders: config.standardHeaders ?? true,
    legacyHeaders: config.legacyHeaders ?? false
  });
};

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // General API rate limiter
  general: createRateLimiter(rateLimitConfigs.general, false),

  // Authentication rate limiters
  auth: createRateLimiter(rateLimitConfigs.auth, false),
  register: createRateLimiter(rateLimitConfigs.register, false),
  passwordReset: createRateLimiter(rateLimitConfigs.passwordReset, false),

  // Feature-specific rate limiters
  search: createRateLimiter(rateLimitConfigs.search, true),
  data: createRateLimiter(rateLimitConfigs.data, true),
  modify: createRateLimiter(rateLimitConfigs.modify, true),
  alerts: createRateLimiter(rateLimitConfigs.alerts, true),
  follows: createRateLimiter(rateLimitConfigs.follows, true),
  admin: createRateLimiter(rateLimitConfigs.admin, true),
  public: createRateLimiter(rateLimitConfigs.public, false)
};

/**
 * Tiered rate limiting based on user subscription
 */
export const createTieredRateLimit = (
  baseConfig: RateLimitConfig,
  multipliers: { [key: string]: number } = {}
) => {
  return createRateLimiter({
    ...baseConfig,
    // Override max to be dynamic based on user subscription
    max: (req: Request): number => {
      const subscriptionStatus = req.user?.subscriptionStatus || 'cancelled';
      const multiplier = multipliers[subscriptionStatus] || 1;
      return Math.floor(baseConfig.max * multiplier);
    }
  }, true);
};

/**
 * Subscription-based rate limiters
 */
export const tieredRateLimiters = {
  // Data access with subscription tiers
  dataAccess: createTieredRateLimit(rateLimitConfigs.data, {
    active: 2.0,      // 2x rate limit for active subscribers
    suspended: 0.5,   // 0.5x rate limit for suspended accounts
    cancelled: 0.1    // 0.1x rate limit for cancelled accounts
  }),

  // Search with subscription tiers
  searchAccess: createTieredRateLimit(rateLimitConfigs.search, {
    active: 3.0,      // 3x rate limit for active subscribers
    suspended: 0.5,   // 0.5x rate limit for suspended accounts
    cancelled: 0.2    // 0.2x rate limit for cancelled accounts
  }),

  // Follow operations (only for active subscribers)
  followAccess: createTieredRateLimit(rateLimitConfigs.follows, {
    active: 1.0,      // Normal rate limit for active subscribers
    suspended: 0.0,   // No follows for suspended accounts
    cancelled: 0.0    // No follows for cancelled accounts
  })
};

/**
 * Adaptive rate limiting based on system load
 */
export const createAdaptiveRateLimit = (
  baseConfig: RateLimitConfig,
  loadThresholds: { [key: string]: number } = {}
) => {
  return createRateLimiter({
    ...baseConfig,
    max: (req: Request): number => {
      // This could be enhanced to check actual system metrics
      // For now, it's a placeholder for future enhancement
      const currentHour = new Date().getHours();
      
      // Reduce limits during peak hours (9 AM - 5 PM)
      if (currentHour >= 9 && currentHour <= 17) {
        return Math.floor(baseConfig.max * 0.8); // 20% reduction during peak hours
      }
      
      return baseConfig.max;
    }
  }, true);
};

/**
 * Rate limit bypass for specific conditions
 */
export const createBypassableRateLimit = (
  baseConfig: RateLimitConfig,
  bypassCondition: (req: Request) => boolean
) => {
  return rateLimit({
    ...baseConfig,
    skip: (req: Request): boolean => {
      return bypassCondition(req);
    },
    keyGenerator: createKeyGenerator(true),
    handler: rateLimitHandler(baseConfig.message || defaultConfig.message!)
  });
};

/**
 * IP whitelist rate limit bypass
 */
const WHITELISTED_IPS = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];

export const createWhitelistedRateLimit = (baseConfig: RateLimitConfig) => {
  return createBypassableRateLimit(baseConfig, (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return WHITELISTED_IPS.includes(ip);
  });
};

/**
 * Rate limit metrics (for monitoring)
 */
export const rateLimitMetrics = {
  // Track rate limit hits for monitoring
  trackHit: (endpoint: string, userId?: string, ip?: string) => {
    const timestamp = new Date().toISOString();
    console.log(`Rate limit hit: ${endpoint} - User: ${userId || 'anonymous'} - IP: ${ip} - Time: ${timestamp}`);
    
    // In a real application, you might want to send this to a monitoring service
    // like Datadog, New Relic, or custom analytics
  },

  // Get rate limit status for a key
  getStatus: async (key: string): Promise<{ remaining: number; resetTime: Date } | null> => {
    // This would typically query your rate limit store (Redis, etc.)
    // For now, return null as a placeholder
    return null;
  }
};

/**
 * Rate limit configuration based on environment
 */
export const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // More lenient limits in development
  if (isDevelopment) {
    return Object.keys(rateLimitConfigs).reduce((acc, key) => {
      acc[key] = {
        ...rateLimitConfigs[key as keyof typeof rateLimitConfigs],
        max: rateLimitConfigs[key as keyof typeof rateLimitConfigs].max * 10 // 10x limits in dev
      };
      return acc;
    }, {} as typeof rateLimitConfigs);
  }

  // Stricter limits in production
  if (isProduction) {
    return Object.keys(rateLimitConfigs).reduce((acc, key) => {
      acc[key] = {
        ...rateLimitConfigs[key as keyof typeof rateLimitConfigs],
        max: Math.floor(rateLimitConfigs[key as keyof typeof rateLimitConfigs].max * 0.8) // 20% stricter in prod
      };
      return acc;
    }, {} as typeof rateLimitConfigs);
  }

  return rateLimitConfigs;
};

/**
 * Utility to create custom rate limiter
 */
export const createCustomRateLimit = (
  windowMs: number,
  max: number,
  message: string,
  useUserKey: boolean = false
): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false
  }, useUserKey);
};

export default {
  rateLimiters,
  tieredRateLimiters,
  createRateLimiter,
  createTieredRateLimit,
  createAdaptiveRateLimit,
  createBypassableRateLimit,
  createWhitelistedRateLimit,
  createCustomRateLimit,
  rateLimitMetrics,
  getEnvironmentConfig
};