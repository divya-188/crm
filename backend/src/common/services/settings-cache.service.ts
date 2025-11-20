import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class SettingsCacheService {
  private readonly logger = new Logger(SettingsCacheService.name);
  private readonly defaultTTL = 3600; // 1 hour
  private readonly prefix = 'settings:';

  constructor(private redisService: RedisService) {}

  /**
   * Get a cached value
   * @param key Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const cached = await this.redisService.get<T>(fullKey);
      
      return cached;
    } catch (error) {
      this.logger.error(`Cache get failed for key ${key}: ${error.message}`);
      return null; // Graceful degradation
    }
  }

  /**
   * Set a cached value
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const expiry = ttl || this.defaultTTL;

      await this.redisService.set(fullKey, value, expiry);
    } catch (error) {
      this.logger.error(`Cache set failed for key ${key}: ${error.message}`);
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Invalidate a specific cache key
   * @param key Cache key to invalidate
   */
  async invalidate(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.redisService.del(fullKey);
      
      // Also invalidate related keys
      await this.invalidatePattern(`${fullKey}:*`);
      
      this.logger.log(`Cache invalidated: ${key}`);
    } catch (error) {
      this.logger.error(`Cache invalidation failed for key ${key}: ${error.message}`);
    }
  }

  /**
   * Invalidate all keys matching a pattern
   * @param pattern Pattern to match (e.g., 'settings:tenant:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(pattern);
      
      if (keys && keys.length > 0) {
        // Delete keys one by one to avoid spread argument issues
        for (const key of keys) {
          await this.redisService.del(key);
        }
        this.logger.log(`Cache invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache pattern invalidation failed for ${pattern}: ${error.message}`);
    }
  }

  /**
   * Invalidate all settings cache
   */
  async invalidateAll(): Promise<void> {
    await this.invalidatePattern(`${this.prefix}*`);
  }

  /**
   * Get cache key for platform settings
   * @param category Settings category
   * @returns Cache key
   */
  getPlatformKey(category: string): string {
    return `platform:${category}`;
  }

  /**
   * Get cache key for tenant settings
   * @param tenantId Tenant ID
   * @param category Settings category
   * @returns Cache key
   */
  getTenantKey(tenantId: string, category: string): string {
    return `tenant:${tenantId}:${category}`;
  }

  /**
   * Get cache key for user preferences
   * @param userId User ID
   * @param category Preferences category
   * @returns Cache key
   */
  getUserKey(userId: string, category: string): string {
    return `user:${userId}:${category}`;
  }

  /**
   * Get full cache key with prefix
   * @param key Base key
   * @returns Full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Check if cache is available
   * @returns True if Redis is connected
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.redisService.ping();
      return true;
    } catch (error) {
      this.logger.warn('Cache is not available');
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsed: string;
    hitRate: number;
  }> {
    try {
      const keys = await this.redisService.keys(`${this.prefix}*`);
      const info = await this.redisService.info('stats');
      
      // Parse Redis INFO output
      const stats = this.parseRedisInfo(info);
      
      return {
        totalKeys: keys?.length || 0,
        memoryUsed: stats.used_memory_human || 'N/A',
        hitRate: this.calculateHitRate(stats),
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return {
        totalKeys: 0,
        memoryUsed: 'N/A',
        hitRate: 0,
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const stats: Record<string, string> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    }
    
    return stats;
  }

  private calculateHitRate(stats: Record<string, string>): number {
    const hits = parseInt(stats.keyspace_hits || '0', 10);
    const misses = parseInt(stats.keyspace_misses || '0', 10);
    const total = hits + misses;
    
    if (total === 0) return 0;
    
    return (hits / total) * 100;
  }
}
