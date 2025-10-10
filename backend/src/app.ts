import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import router from './routes';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { sanitizeInput } from './middleware/validation';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    }));

    // Request logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    }

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: Request, res: Response, buf: Buffer) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          res.status(400).json({ 
            success: false, 
            error: 'Invalid JSON format' 
          });
          throw new Error('Invalid JSON');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Compression middleware
    this.app.use(compression());

    // Global rate limiting (backup protection)
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Input sanitization
    this.app.use(sanitizeInput);

    // Request ID middleware for tracing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Trust proxy if behind reverse proxy
    if (process.env.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
    }
  }

  private initializeRoutes(): void {
    // Health check endpoint (before API versioning)
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API routes with versioning
    this.app.use('/api/v1', router);

    // Redirect root to API info
    this.app.get('/', (req: Request, res: Response) => {
      res.redirect('/api/v1');
    });

    // API documentation endpoint (placeholder)
    this.app.get('/api/v1/docs', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'API Documentation',
        openapi: '3.0.3',
        info: {
          title: 'Congressional Trading Transparency Platform API',
          version: '1.0.0',
          description: 'API for tracking congressional and corporate insider trading data'
        },
        servers: [
          {
            url: `${req.protocol}://${req.get('host')}/api/v1`,
            description: 'Current server'
          }
        ],
        documentation: 'https://github.com/your-org/congresstracker/blob/main/docs/api.md'
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler - must come before general error handler
    this.app.use(notFoundHandler);

    // Global error handler - must be last
    this.app.use(errorHandler);
  }

  public listen(port: number, callback?: () => void): void {
    this.app.listen(port, callback);
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;