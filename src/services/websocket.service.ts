import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { aggregationService } from '../services/aggregation.service';
import { config } from '../config';
import { logger } from '../utils/logger';
import { WebSocketMessage, TokenData } from '../types';

export class WebSocketService {
  private io: SocketIOServer;
  private updateInterval: NodeJS.Timeout | null = null;
  private connectedClients: Set<string> = new Set();
  private previousTokenData: Map<string, TokenData> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.startUpdateInterval();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connectedClients.add(clientId);
      logger.info(`Client connected: ${clientId}, Total clients: ${this.connectedClients.size}`);

      // Send initial data
      this.sendInitialData(socket);

      // Handle client requests
      socket.on('subscribe', (data) => {
        logger.info(`Client ${clientId} subscribed`, data);
      });

      socket.on('unsubscribe', (data) => {
        logger.info(`Client ${clientId} unsubscribed`, data);
      });

      socket.on('disconnect', () => {
        this.connectedClients.delete(clientId);
        logger.info(`Client disconnected: ${clientId}, Total clients: ${this.connectedClients.size}`);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for client ${clientId}`, { error });
      });
    });
  }

  private async sendInitialData(socket: Socket): Promise<void> {
    try {
      const result = await aggregationService.getTokens(30);

      const message: WebSocketMessage = {
        type: 'initial',
        data: result.data,
        timestamp: Date.now(),
      };

      socket.emit('tokens', message);
      logger.info(`Sent initial data to client ${socket.id}`);
    } catch (error) {
      logger.error('Error sending initial data', { error });
      
      const errorMessage: WebSocketMessage = {
        type: 'error',
        error: 'Failed to fetch initial data',
        timestamp: Date.now(),
      };

      socket.emit('error', errorMessage);
    }
  }

  private startUpdateInterval(): void {
    // Clear existing interval if any
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Send updates periodically
    this.updateInterval = setInterval(async () => {
      if (this.connectedClients.size === 0) {
        logger.debug('No connected clients, skipping update');
        return;
      }

      await this.broadcastUpdates();
    }, config.websocket.updateInterval);

    logger.info(`WebSocket update interval started: ${config.websocket.updateInterval}ms`);
  }

  private async broadcastUpdates(): Promise<void> {
    try {
      // Fetch fresh data
      const result = await aggregationService.getTokens(30);
      const currentTokens = result.data;

      // Detect changes
      const updates: TokenData[] = [];
      
      currentTokens.forEach((token) => {
        const previous = this.previousTokenData.get(token.token_address);
        
        if (!previous) {
          // New token
          updates.push(token);
        } else {
          // Check for significant changes
          const priceChanged = Math.abs(token.price_sol - previous.price_sol) / previous.price_sol > 0.01;
          const volumeChanged = Math.abs(token.volume_sol - previous.volume_sol) / previous.volume_sol > 0.1;
          
          if (priceChanged || volumeChanged) {
            updates.push(token);
          }
        }

        // Update cache
        this.previousTokenData.set(token.token_address, token);
      });

      if (updates.length > 0) {
        const message: WebSocketMessage = {
          type: 'update',
          data: updates,
          timestamp: Date.now(),
        };

        this.io.emit('tokens:update', message);
        logger.info(`Broadcasted ${updates.length} token updates to ${this.connectedClients.size} clients`);
      } else {
        logger.debug('No significant changes detected');
      }
    } catch (error) {
      logger.error('Error broadcasting updates', { error });
    }
  }

  public async broadcastRefresh(): Promise<void> {
    try {
      const result = await aggregationService.getTokens(30);

      const message: WebSocketMessage = {
        type: 'initial',
        data: result.data,
        timestamp: Date.now(),
      };

      this.io.emit('tokens:refresh', message);
      logger.info(`Broadcasted refresh to ${this.connectedClients.size} clients`);
    } catch (error) {
      logger.error('Error broadcasting refresh', { error });
    }
  }

  public getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  public close(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.io.close();
    logger.info('WebSocket service closed');
  }
}
