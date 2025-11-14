import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;

  constructor(private configService: ConfigService) {
    const redisConfig = this.configService.get('redis');
    this.keyPrefix = redisConfig.keyPrefix;
    this.defaultTTL = redisConfig.ttl;

    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleInit() {
    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis is ready to accept commands');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Set a value in Redis with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    const serializedValue = JSON.stringify(value);
    const ttlToUse = ttl || this.defaultTTL;

    if (ttlToUse > 0) {
      await this.client.setex(prefixedKey, ttlToUse, serializedValue);
    } else {
      await this.client.set(prefixedKey, serializedValue);
    }
  }

  /**
   * Get a value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.getPrefixedKey(key);
    const value = await this.client.get(prefixedKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error parsing Redis value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    await this.client.del(prefixedKey);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const prefixedPattern = this.getPrefixedKey(pattern);
    const keys = await this.client.keys(prefixedPattern);

    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key);
    const result = await this.client.exists(prefixedKey);
    return result === 1;
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    await this.client.expire(prefixedKey, ttl);
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.ttl(prefixedKey);
  }

  /**
   * Increment a value
   */
  async incr(key: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.incr(prefixedKey);
  }

  /**
   * Decrement a value
   */
  async decr(key: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.decr(prefixedKey);
  }

  /**
   * Add value to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.sadd(prefixedKey, ...members);
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.smembers(prefixedKey);
  }

  /**
   * Remove member from a set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.srem(prefixedKey, ...members);
  }

  /**
   * Add value to a sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.zadd(prefixedKey, score, member);
  }

  /**
   * Get range from sorted set
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.zrange(prefixedKey, start, stop);
  }

  /**
   * Push value to a list
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.lpush(prefixedKey, ...values);
  }

  /**
   * Get range from list
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const prefixedKey = this.getPrefixedKey(key);
    return await this.client.lrange(prefixedKey, start, stop);
  }

  /**
   * Flush all keys in current database
   */
  async flushdb(): Promise<void> {
    await this.client.flushdb();
  }

  /**
   * Get prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
