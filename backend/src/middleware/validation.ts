import { Request, Response, NextFunction } from 'express';
import { body, param, query, ValidationChain, validationResult, matchedData } from 'express-validator';

/**
 * Middleware to handle validation errors and format response
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
      location: error.location || 'body'
    }));

    res.status(400).json({
      error: 'Validation failed',
      message: 'Request validation errors occurred',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
    return;
  }

  // Add validated data to request for controllers to use
  req.validatedData = matchedData(req);
  next();
};

/**
 * Common validation rules
 */
export const validators = {
  // User validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  name: body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),

  // UUID validations
  uuid: (field: string, location: 'param' | 'body' | 'query' = 'param') => {
    const validator = location === 'param' ? param(field) : 
                     location === 'body' ? body(field) : query(field);
    return validator
      .isUUID(4)
      .withMessage(`${field} must be a valid UUID`);
  },

  // Stock ticker validation
  tickerSymbol: (field: string, location: 'param' | 'body' | 'query' = 'param') => {
    const validator = location === 'param' ? param(field) : 
                     location === 'body' ? body(field) : query(field);
    return validator
      .isLength({ min: 1, max: 10 })
      .matches(/^[A-Z0-9]+$/)
      .withMessage(`${field} must be 1-10 alphanumeric characters`);
  },

  // Date validations
  date: (field: string, location: 'body' | 'query' = 'body') => {
    const validator = location === 'body' ? body(field) : query(field);
    return validator
      .optional()
      .isISO8601()
      .toDate()
      .withMessage(`${field} must be a valid ISO 8601 date`);
  },

  dateRange: (startField: string, endField: string, location: 'query' | 'body' = 'query') => {
    return [
      validators.date(startField, location),
      validators.date(endField, location),
      // Custom validation to ensure start date is before end date
      (location === 'body' ? body(endField) : query(endField))
        .custom((endDate, { req }) => {
          const startDate = location === 'body' ? req.body[startField] : req.query[startField];
          if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            throw new Error(`${endField} must be after ${startField}`);
          }
          return true;
        })
    ];
  },

  // Pagination validation
  pagination: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage('Offset must be 0 or greater')
  ],

  // Congressional member validation
  position: body('position')
    .isIn(['senator', 'representative'])
    .withMessage('Position must be either "senator" or "representative"'),

  stateCode: body('stateCode')
    .isLength({ min: 2, max: 2 })
    .matches(/^[A-Z]{2}$/)
    .withMessage('State code must be 2 uppercase letters'),

  district: body('district')
    .optional()
    .isInt({ min: 1, max: 99 })
    .toInt()
    .withMessage('District must be between 1 and 99'),

  partyAffiliation: body('partyAffiliation')
    .optional()
    .isIn(['democratic', 'republican', 'independent', 'other'])
    .withMessage('Party affiliation must be one of: democratic, republican, independent, other'),

  // Stock trade validation
  traderType: body('traderType')
    .isIn(['congressional', 'corporate'])
    .withMessage('Trader type must be either "congressional" or "corporate"'),

  transactionType: body('transactionType')
    .isIn(['buy', 'sell', 'exchange'])
    .withMessage('Transaction type must be one of: buy, sell, exchange'),

  estimatedValue: body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .toFloat()
    .withMessage('Estimated value must be a positive number'),

  quantity: body('quantity')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Quantity must be a positive integer'),

  // Alert validation
  alertType: body('alertType')
    .isIn(['politician', 'stock', 'pattern'])
    .withMessage('Alert type must be one of: politician, stock, pattern'),

  alertStatus: body('alertStatus')
    .optional()
    .isIn(['active', 'paused', 'deleted'])
    .withMessage('Alert status must be one of: active, paused, deleted'),

  // Pattern configuration validation
  patternConfig: body('patternConfig')
    .optional()
    .isObject()
    .withMessage('Pattern config must be an object'),

  // Search validation
  searchQuery: query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  // Filter validation
  filters: {
    minValue: query('minValue')
      .optional()
      .isFloat({ min: 0 })
      .toFloat()
      .withMessage('Minimum value must be a positive number'),

    maxValue: query('maxValue')
      .optional()
      .isFloat({ min: 0 })
      .toFloat()
      .withMessage('Maximum value must be a positive number'),

    sector: query('sector')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Sector must be between 1 and 100 characters'),

    industry: query('industry')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Industry must be between 1 and 100 characters')
  }
};

/**
 * Validation rule sets for specific endpoints
 */
export const validationRules = {
  // Authentication
  register: [
    validators.email,
    validators.password,
    validators.name,
    handleValidationErrors
  ],

  login: [
    validators.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],

  // User management
  updateProfile: [
    validators.email.optional(),
    validators.name,
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    validators.password.withMessage('New password must be between 8 and 128 characters and contain at least one lowercase letter, one uppercase letter, and one number'),
    handleValidationErrors
  ],

  // Congressional members
  createCongressionalMember: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required and must be less than 255 characters'),
    validators.position,
    validators.stateCode,
    validators.district,
    validators.partyAffiliation,
    validators.date('officeStartDate'),
    validators.date('officeEndDate'),
    // Custom validation for senator/representative rules
    body('district').custom((district, { req }) => {
      if (req.body.position === 'senator' && district !== undefined) {
        throw new Error('Senators cannot have a district number');
      }
      if (req.body.position === 'representative' && !district) {
        throw new Error('Representatives must have a district number');
      }
      return true;
    }),
    handleValidationErrors
  ],

  updateCongressionalMember: [
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    validators.position.optional(),
    body('stateCode').optional().isLength({ min: 2, max: 2 }).matches(/^[A-Z]{2}$/),
    validators.district,
    validators.partyAffiliation,
    validators.date('officeStartDate'),
    validators.date('officeEndDate'),
    handleValidationErrors
  ],

  // Stock tickers
  createStockTicker: [
    validators.tickerSymbol('symbol', 'body'),
    body('companyName').trim().isLength({ min: 1, max: 255 }).withMessage('Company name is required'),
    body('sector').optional().trim().isLength({ max: 100 }),
    body('industry').optional().trim().isLength({ max: 100 }),
    body('marketCap').optional().isFloat({ min: 0 }).toFloat(),
    body('lastPrice').optional().isFloat({ min: 0 }).toFloat(),
    handleValidationErrors
  ],

  updateStockPrice: [
    body('price').isFloat({ min: 0 }).toFloat().withMessage('Price must be a positive number'),
    body('marketCap').optional().isFloat({ min: 0 }).toFloat(),
    handleValidationErrors
  ],

  // Stock trades
  createStockTrade: [
    validators.traderType,
    validators.uuid('traderId', 'body'),
    validators.tickerSymbol('tickerSymbol', 'body'),
    body('transactionDate').isISO8601().toDate().withMessage('Transaction date must be a valid date'),
    validators.transactionType,
    body('amountRange').optional().trim().isLength({ max: 50 }),
    validators.estimatedValue,
    validators.quantity,
    validators.date('filingDate'),
    body('sourceData').optional().isObject(),
    handleValidationErrors
  ],

  // User alerts
  createUserAlert: [
    validators.alertType,
    validators.alertStatus,
    // Conditional validation based on alert type
    body('politicianId').if(body('alertType').equals('politician')).notEmpty().isUUID(4),
    body('tickerSymbol').if(body('alertType').equals('stock')).notEmpty().matches(/^[A-Z0-9]+$/),
    body('patternConfig').if(body('alertType').equals('pattern')).notEmpty().isObject(),
    handleValidationErrors
  ],

  updateUserAlert: [
    validators.alertStatus,
    validators.uuid('politicianId', 'body').optional(),
    validators.tickerSymbol('tickerSymbol', 'body').optional(),
    validators.patternConfig,
    handleValidationErrors
  ],

  // User follows
  createUserFollow: [
    validators.traderType,
    validators.uuid('traderId', 'body'),
    body('billingStatus').optional().isIn(['active', 'suspended', 'cancelled']),
    handleValidationErrors
  ],

  // Search and filtering
  search: [
    validators.searchQuery,
    query('type').optional().isIn(['politician', 'stock', 'all']),
    ...validators.pagination,
    handleValidationErrors
  ],

  tradeFilters: [
    validators.uuid('traderId', 'query').optional(),
    validators.tickerSymbol('tickerSymbol', 'query').optional(),
    query('traderType').optional().isIn(['congressional', 'corporate']),
    query('transactionType').optional().isIn(['buy', 'sell', 'exchange']),
    ...validators.dateRange('startDate', 'endDate', 'query'),
    validators.filters.minValue,
    validators.filters.maxValue,
    query('hasFilingDate').optional().isBoolean().toBoolean(),
    ...validators.pagination,
    handleValidationErrors
  ],

  stockFilters: [
    validators.filters.sector,
    validators.filters.industry,
    validators.filters.minValue.withMessage('Minimum market cap must be a positive number'),
    validators.filters.maxValue.withMessage('Maximum market cap must be a positive number'),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    ...validators.pagination,
    handleValidationErrors
  ],

  // Common parameter validations
  params: {
    id: [validators.uuid('id'), handleValidationErrors],
    userId: [validators.uuid('userId'), handleValidationErrors],
    symbol: [validators.tickerSymbol('symbol'), handleValidationErrors],
    alertId: [validators.uuid('alertId'), handleValidationErrors],
    tradeId: [validators.uuid('tradeId'), handleValidationErrors]
  }
};

/**
 * Utility to create custom validation chains
 */
export const createValidationChain = (validations: ValidationChain[]): Array<ValidationChain | typeof handleValidationErrors> => {
  return [...validations, handleValidationErrors];
};

/**
 * Middleware to sanitize and normalize request data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Trim string values in body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Normalize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim();
      }
    });
  }

  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}

export default {
  validators,
  validationRules,
  handleValidationErrors,
  createValidationChain,
  sanitizeInput
};