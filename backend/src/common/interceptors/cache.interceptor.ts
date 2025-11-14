import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../services/redis.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string | ((args: any[]) => string)>(
      CACHE_KEY_METADATA,
      context.getHandler()
    );

    if (!cacheKey) {
      return next.handle();
    }

    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());

    // Generate cache key
    const args = context.getArgs();
    const key = typeof cacheKey === 'function' ? cacheKey(args) : cacheKey;

    // Try to get from cache
    try {
      const cachedValue = await this.redisService.get(key);
      if (cachedValue !== null) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return of(cachedValue);
      }
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}:`, error);
    }

    // Cache miss - execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.redisService.set(key, data, cacheTTL);
          this.logger.debug(`Cached result for key: ${key}`);
        } catch (error) {
          this.logger.error(`Error setting cache for key ${key}:`, error);
        }
      })
    );
  }
}
