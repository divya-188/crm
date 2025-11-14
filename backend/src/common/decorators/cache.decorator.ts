import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Decorator to enable caching for a method
 * @param key - Cache key or function to generate key from arguments
 * @param ttl - Time to live in seconds (optional)
 */
export const Cacheable = (key: string | ((args: any[]) => string), ttl?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    if (ttl) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};

/**
 * Decorator to invalidate cache
 * @param keys - Cache keys or patterns to invalidate
 */
export const CacheEvict = (...keys: string[]) => {
  return SetMetadata('cache:evict', keys);
};

/**
 * Decorator to invalidate all cache with a pattern
 * @param pattern - Pattern to match keys
 */
export const CacheEvictPattern = (pattern: string) => {
  return SetMetadata('cache:evict:pattern', pattern);
};
