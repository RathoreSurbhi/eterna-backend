import { CacheService } from '../services/cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeAll(() => {
    cacheService = new CacheService();
  });

  afterAll(async () => {
    await cacheService.close();
  });

  describe('set and get', () => {
    it('should set and retrieve a value', async () => {
      const key = 'test:key1';
      const value = { test: 'data', number: 123 };

      await cacheService.set(key, value, 60);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non:existent:key');
      expect(result).toBeNull();
    });

    it('should handle string values', async () => {
      const key = 'test:string';
      const value = 'hello world';

      await cacheService.set(key, value);
      const retrieved = await cacheService.get<string>(key);

      expect(retrieved).toBe(value);
    });

    it('should handle array values', async () => {
      const key = 'test:array';
      const value = [1, 2, 3, 4, 5];

      await cacheService.set(key, value);
      const retrieved = await cacheService.get<number[]>(key);

      expect(retrieved).toEqual(value);
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';
      const value = { data: 'to delete' };

      await cacheService.set(key, value);
      expect(await cacheService.exists(key)).toBe(true);

      await cacheService.del(key);
      expect(await cacheService.exists(key)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      const key = 'test:exists';
      await cacheService.set(key, 'data');

      const exists = await cacheService.exists(key);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await cacheService.exists('test:not:exists');
      expect(exists).toBe(false);
    });
  });

  describe('TTL', () => {
    it('should respect TTL', async () => {
      const key = 'test:ttl';
      await cacheService.set(key, 'data', 1);

      const ttl = await cacheService.getTTL(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1);
    });
  });

  describe('delPattern', () => {
    it('should delete keys matching pattern', async () => {
      await cacheService.set('pattern:test:1', 'data1');
      await cacheService.set('pattern:test:2', 'data2');
      await cacheService.set('pattern:other:1', 'data3');

      await cacheService.delPattern('pattern:test:*');

      expect(await cacheService.exists('pattern:test:1')).toBe(false);
      expect(await cacheService.exists('pattern:test:2')).toBe(false);
      expect(await cacheService.exists('pattern:other:1')).toBe(true);

      // Cleanup
      await cacheService.del('pattern:other:1');
    });
  });
});
