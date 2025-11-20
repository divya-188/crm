import { Test, TestingModule } from '@nestjs/testing';
import { SettingsCacheService } from '../settings-cache.service';
import { RedisService } from '../redis.service';

describe('SettingsCacheService', () => {
  let service: SettingsCacheService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const redisServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsCacheService,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    service = module.get<SettingsCacheService>(SettingsCacheService);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value', async () => {
      const testData = { foo: 'bar' };
      redisService.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
      expect(redisService.get).toHaveBeenCalledWith('settings:test-key');
    });

    it('should return null if key not found', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null on error (graceful degradation)', async () => {
      redisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should cache a value with default TTL', async () => {
      const testData = { foo: 'bar' };
      redisService.set.mockResolvedValue(undefined);

      await service.set('test-key', testData);

      expect(redisService.set).toHaveBeenCalledWith(
        'settings:test-key',
        testData,
        3600, // default TTL
      );
    });

    it('should cache a value with custom TTL', async () => {
      const testData = { foo: 'bar' };
      redisService.set.mockResolvedValue(undefined);

      await service.set('test-key', testData, 7200);

      expect(redisService.set).toHaveBeenCalledWith(
        'settings:test-key',
        testData,
        7200,
      );
    });

    it('should not throw on error (graceful degradation)', async () => {
      redisService.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('test-key', { foo: 'bar' })).resolves.not.toThrow();
    });
  });

  describe('invalidate', () => {
    it('should delete cache key', async () => {
      redisService.del.mockResolvedValue(undefined);
      redisService.keys.mockResolvedValue([]);

      await service.invalidate('test-key');

      expect(redisService.del).toHaveBeenCalledWith('settings:test-key');
    });

    it('should invalidate related keys', async () => {
      redisService.del.mockResolvedValue(undefined);
      redisService.keys.mockResolvedValue(['settings:test-key:sub1', 'settings:test-key:sub2']);

      await service.invalidate('test-key');

      expect(redisService.keys).toHaveBeenCalledWith('settings:test-key:*');
      // Keys are deleted one by one now
      expect(redisService.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate all keys matching pattern', async () => {
      const keys = ['settings:tenant:123:branding', 'settings:tenant:123:team'];
      redisService.keys.mockResolvedValue(keys);
      redisService.del.mockResolvedValue(undefined);

      await service.invalidatePattern('settings:tenant:123:*');

      expect(redisService.keys).toHaveBeenCalledWith('settings:tenant:123:*');
      // Keys are deleted one by one now
      expect(redisService.del).toHaveBeenCalledTimes(2);
    });

    it('should handle no matching keys', async () => {
      redisService.keys.mockResolvedValue([]);

      await service.invalidatePattern('settings:tenant:999:*');

      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('key generators', () => {
    it('should generate platform key', () => {
      const key = service.getPlatformKey('payment');
      expect(key).toBe('platform:payment');
    });

    it('should generate tenant key', () => {
      const key = service.getTenantKey('tenant-123', 'branding');
      expect(key).toBe('tenant:tenant-123:branding');
    });

    it('should generate user key', () => {
      const key = service.getUserKey('user-456', 'preferences');
      expect(key).toBe('user:user-456:preferences');
    });
  });

  describe('isAvailable', () => {
    it('should return true if Redis is available', async () => {
      redisService.ping.mockResolvedValue('PONG');

      const result = await service.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false if Redis is not available', async () => {
      redisService.ping.mockRejectedValue(new Error('Connection refused'));

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      redisService.keys.mockResolvedValue(['settings:key1', 'settings:key2']);
      redisService.info.mockResolvedValue(
        '# Stats\r\nkeyspace_hits:100\r\nkeyspace_misses:20\r\nused_memory_human:1.5M\r\n',
      );

      const stats = await service.getStats();

      expect(stats.totalKeys).toBe(2);
      expect(stats.memoryUsed).toBe('1.5M');
      expect(stats.hitRate).toBeCloseTo(83.33, 1); // 100/(100+20) * 100
    });

    it('should handle errors gracefully', async () => {
      redisService.keys.mockRejectedValue(new Error('Redis error'));

      const stats = await service.getStats();

      expect(stats.totalKeys).toBe(0);
      expect(stats.memoryUsed).toBe('N/A');
      expect(stats.hitRate).toBe(0);
    });
  });
});
