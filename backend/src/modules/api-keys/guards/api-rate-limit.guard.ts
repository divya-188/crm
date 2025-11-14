import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';

@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey;

    if (!apiKey) {
      // If no API key, skip rate limiting (should be caught by auth guard)
      return true;
    }

    const key = `ratelimit:apikey:${apiKey.id}`;
    const limit = apiKey.rateLimit;
    const window = apiKey.rateLimitWindow;

    // Get current count
    const current = await this.redisService.get<number>(key);
    const count = current || 0;

    if (count >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          limit,
          window,
          retryAfter: await this.redisService.ttl(key),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    if (count === 0) {
      await this.redisService.set(key, 1, window);
    } else {
      await this.redisService.incr(key);
    }

    // Add rate limit headers to response
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', limit - count - 1);
    response.setHeader('X-RateLimit-Reset', await this.getReset(key));

    return true;
  }

  private async getReset(key: string): Promise<number> {
    const ttl = await this.redisService.ttl(key);
    return Math.floor(Date.now() / 1000) + ttl;
  }
}
