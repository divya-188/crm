import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import redisConfig from '../config/redis.config';
import { RedisService } from './services/redis.service';
import { SessionService } from './services/session.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { TenantGuard } from './guards/tenant.guard';
import { TenantsModule } from '../modules/tenants/tenants.module';
import { GracePeriodWarningMiddleware } from './middleware/grace-period-warning.middleware';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    TenantsModule,
    TypeOrmModule.forFeature([Subscription]),
  ],
  providers: [
    RedisService,
    SessionService,
    CacheInterceptor,
    TenantGuard,
    GracePeriodWarningMiddleware,
  ],
  exports: [
    TypeOrmModule,
    RedisService,
    SessionService,
    CacheInterceptor,
    TenantGuard,
    GracePeriodWarningMiddleware,
  ],
})
export class CommonModule {}
