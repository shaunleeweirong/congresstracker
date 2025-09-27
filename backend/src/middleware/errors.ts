import { Request, Response, NextFunction } from 'express';
import { DatabaseError } from 'pg';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: string = 'AUTH_REQUIRED') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', code: string = 'ACCESS_DENIED') {
    super(message, 403, code);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class (e.g., duplicate resources)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', { service });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Database error handler
 */
const handleDatabaseError = (error: DatabaseError): AppError => {
  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (error.code) {
    case '23505': // unique_violation
      return new ConflictError('Resource already exists', {
        constraint: error.constraint,
        detail: error.detail
      });
    
    case '23503': // foreign_key_violation
      return new ValidationError('Referenced resource does not exist', {
        constraint: error.constraint,
        detail: error.detail
      });
    
    case '23502': // not_null_violation
      return new ValidationError('Required field is missing', {
        column: error.column,
        table: error.table
      });
    
    case '23514': // check_violation
      return new ValidationError('Data validation failed', {
        constraint: error.constraint,
        detail: error.detail
      });
    
    case '42703': // undefined_column
      return new AppError('Database query error', 400, 'DATABASE_QUERY_ERROR', {
        column: error.column,
        table: error.table
      });
    
    case '42P01': // undefined_table
      return new AppError('Database schema error', 500, 'DATABASE_SCHEMA_ERROR', {
        table: error.table
      });
    
    case '08006': // connection_failure
    case '08001': // unable_to_connect
      return new AppError('Database connection error', 503, 'DATABASE_CONNECTION_ERROR');
    
    default:
      return new AppError('Database error', 500, 'DATABASE_ERROR', {
        code: error.code,
        detail: error.detail
      });
  }
};

/**
 * JWT error handler
 */
const handleJWTError = (error: any): AppError => {
  switch (error.name) {
    case 'TokenExpiredError':
      return new AuthenticationError('Token expired', 'AUTH_TOKEN_EXPIRED');
    
    case 'JsonWebTokenError':
      return new AuthenticationError('Invalid token', 'AUTH_TOKEN_INVALID');
    
    case 'NotBeforeError':
      return new AuthenticationError('Token not active', 'AUTH_TOKEN_NOT_ACTIVE');
    
    default:
      return new AuthenticationError('Authentication failed', 'AUTH_TOKEN_ERROR');
  }
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle different error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'DatabaseError' || error.name === 'PostgresError') {
    appError = handleDatabaseError(error as DatabaseError);
  } else if (error.name?.includes('JsonWebToken') || error.name?.includes('Token')) {
    appError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    appError = new ValidationError('Invalid JSON in request body');
  } else {
    // Unknown error
    appError = new AppError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error details (but not for client errors)
  if (appError.statusCode >= 500) {
    console.error('Server Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    error: appError.message,
    message: appError.message,
    code: appError.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details in development mode or for validation errors
  if (process.env.NODE_ENV === 'development' || appError.statusCode < 500) {
    if (appError.details) {
      errorResponse.details = appError.details;
    }
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
  }

  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Utility functions for throwing common errors
 */
export const throwNotFound = (resource: string = 'Resource'): never => {
  throw new NotFoundError(resource);
};

export const throwValidationError = (message: string, details?: any): never => {
  throw new ValidationError(message, details);
};

export const throwAuthenticationError = (message?: string, code?: string): never => {
  throw new AuthenticationError(message, code);
};

export const throwAuthorizationError = (message?: string, code?: string): never => {
  throw new AuthorizationError(message, code);
};

export const throwConflictError = (message: string, details?: any): never => {
  throw new ConflictError(message, details);
};

export const throwRateLimitError = (message?: string): never => {
  throw new RateLimitError(message);
};

export const throwExternalServiceError = (service: string, message?: string): never => {
  throw new ExternalServiceError(service, message);
};

/**
 * Error factory for consistent error creation
 */
export const createError = {
  notFound: (resource: string = 'Resource') => new NotFoundError(resource),
  validation: (message: string, details?: any) => new ValidationError(message, details),
  authentication: (message?: string, code?: string) => new AuthenticationError(message, code),
  authorization: (message?: string, code?: string) => new AuthorizationError(message, code),
  conflict: (message: string, details?: any) => new ConflictError(message, details),
  rateLimit: (message?: string) => new RateLimitError(message),
  externalService: (service: string, message?: string) => new ExternalServiceError(service, message),
  internal: (message: string, code?: string, details?: any) => new AppError(message, 500, code || 'INTERNAL_ERROR', details)
};

/**
 * Express error boundary for unhandled promise rejections
 */
export const setupErrorHandling = (): void => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Promise Rejection:', reason);
    // In production, you might want to gracefully shut down
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled Promise Rejection. Shutting down...');
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    // Always exit on uncaught exception
    process.exit(1);
  });

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
  createError,
  setupErrorHandling,
  throwNotFound,
  throwValidationError,
  throwAuthenticationError,
  throwAuthorizationError,
  throwConflictError,
  throwRateLimitError,
  throwExternalServiceError
};