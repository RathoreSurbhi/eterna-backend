import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { WebSocketService } from './services/websocket.service';
import { SchedulerService } from './services/scheduler.service';
import routes from './routes';
import { cacheService } from './services/cache.service';

class Application {
  private app: Express;
  private httpServer: HttpServer;
  private wsService: WebSocketService;
  private schedulerService: SchedulerService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wsService = new WebSocketService(this.httpServer);
    this.schedulerService = new SchedulerService(this.wsService);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(
      cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api', limiter);

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
        });
      });

      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Eterna Backend API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          tokens: '/api/tokens',
          token_by_address: '/api/tokens/:address',
          refresh: '/api/refresh',
        },
        websocket: {
          connected_clients: this.wsService.getConnectedClientCount(),
        },
      });
    });

    // API routes
    this.app.use('/api', routes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.url,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: config.server.nodeEnv === 'development' ? err.message : undefined,
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Test Redis connection
      await cacheService.get('test');
      logger.info('Redis connection successful');

      // Start scheduler
      this.schedulerService.start();

      // Start HTTP server
      this.httpServer.listen(config.server.port, () => {
        logger.info(`Server started on port ${config.server.port}`);
        logger.info(`Environment: ${config.server.nodeEnv}`);
        logger.info(`WebSocket service running`);
      });
    } catch (error) {
      logger.error('Failed to start application', { error });
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    logger.info('Shutting down application...');

    this.schedulerService.stop();
    this.wsService.close();
    await cacheService.close();

    this.httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }
}

// Create and start application
const app = new Application();

// Handle graceful shutdown
process.on('SIGTERM', () => app.stop());
process.on('SIGINT', () => app.stop());

// Start the application
app.start();

export default app;
