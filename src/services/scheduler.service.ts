import cron from 'node-cron';
import { aggregationService } from '../services/aggregation.service';
import { logger } from '../utils/logger';
import { WebSocketService } from '../services/websocket.service';

export class SchedulerService {
  private tasks: cron.ScheduledTask[] = [];
  private wsService?: WebSocketService;

  constructor(wsService?: WebSocketService) {
    this.wsService = wsService;
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    // Refresh cache every 2 minutes
    const cacheRefreshTask = cron.schedule('*/2 * * * *', async () => {
      try {
        logger.info('Running scheduled cache refresh');
        await aggregationService.refreshCache();
        
        // Notify WebSocket clients
        if (this.wsService) {
          await this.wsService.broadcastRefresh();
        }
        
        logger.info('Scheduled cache refresh completed');
      } catch (error) {
        logger.error('Error in scheduled cache refresh', { error });
      }
    });

    // Update aggregated data every 30 seconds (lighter than full refresh)
    const quickUpdateTask = cron.schedule('*/30 * * * * *', async () => {
      try {
        logger.debug('Running quick data update');
        await aggregationService.aggregateTokens(true);
      } catch (error) {
        logger.error('Error in quick update', { error });
      }
    });

    this.tasks.push(cacheRefreshTask, quickUpdateTask);

    logger.info('Scheduler service started with tasks:', {
      cacheRefresh: 'every 2 minutes',
      quickUpdate: 'every 30 seconds',
    });
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    this.tasks.forEach((task) => task.stop());
    logger.info('Scheduler service stopped');
  }
}
