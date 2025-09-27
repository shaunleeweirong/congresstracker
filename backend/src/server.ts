import dotenv from 'dotenv';
import App from './app';
// Temporary mock connections for testing
class MockDatabaseConnection {
  static async initialize(): Promise<void> {
    console.log('✅ Database connection established (mock)');
  }
  static async close(): Promise<void> {
    console.log('✅ Database connection closed (mock)');
  }
}

class MockRedisConnection {
  static async initialize(): Promise<void> {
    console.log('✅ Redis connection established (mock)');
  }
  static async close(): Promise<void> {
    console.log('✅ Redis connection closed (mock)');
  }
}

// Load environment variables
dotenv.config();

class Server {
  private app: App;
  private port: number;
  private server: any;
  private isShuttingDown: boolean = false;

  constructor() {
    this.app = new App();
    this.port = parseInt(process.env.PORT || '3001', 10);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await MockDatabaseConnection.initialize();

      // Initialize Redis connection (optional)
      try {
        await MockRedisConnection.initialize();
      } catch (error) {
        console.warn('⚠️  Redis connection failed (running without cache):', error);
      }

      // Start HTTP server
      this.server = this.app.getApp().listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📋 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 API docs: http://localhost:${this.port}/api/v1/docs`);
      });

      // Handle server errors
      this.server.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

        switch (error.code) {
          case 'EACCES':
            console.error(`❌ ${bind} requires elevated privileges`);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            console.error(`❌ ${bind} is already in use`);
            process.exit(1);
            break;
          default:
            throw error;
        }
      });

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    // Handle process termination signals
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);
        this.gracefulShutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle SIGPIPE (broken pipe) gracefully
    process.on('SIGPIPE', () => {
      console.warn('⚠️  SIGPIPE received (broken pipe)');
    });
  }

  private async gracefulShutdown(signal: string | NodeJS.Signals): Promise<void> {
    if (this.isShuttingDown) {
      console.log('🔄 Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log(`🛑 Starting graceful shutdown (${signal})...`);

    const shutdownTimeout = setTimeout(() => {
      console.error('❌ Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000); // 30 second timeout

    try {
      // Stop accepting new connections
      if (this.server) {
        console.log('🔌 Closing HTTP server...');
        await new Promise<void>((resolve, reject) => {
          this.server.close((err: any) => {
            if (err) {
              reject(err);
            } else {
              console.log('✅ HTTP server closed');
              resolve();
            }
          });
        });
      }

      // Close database connections
      console.log('🗄️  Closing database connections...');
      await MockDatabaseConnection.close();

      // Close Redis connections
      try {
        await MockRedisConnection.close();
      } catch (error) {
        console.warn('⚠️  Redis close warning:', error);
      }

      clearTimeout(shutdownTimeout);
      console.log('✅ Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      clearTimeout(shutdownTimeout);
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  public getApp(): App {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

export default Server;