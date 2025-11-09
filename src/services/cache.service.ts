import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheService {
  private redis: Redis;
  private defaultTTL: number;

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.defaultTTL = config.cache.ttl;

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error });
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Error getting cache', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Error setting cache', { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting cache', { key, error });
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Error deleting cache pattern', { pattern, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking cache existence', { key, error });
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Error getting TTL', { key, error });
      return -1;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  getClient(): Redis {
    return this.redis;
  }
}

export const cacheService = new CacheService();
