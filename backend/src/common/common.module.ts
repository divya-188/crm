import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfig from '../config/redis.config';
import { RedisService } from './services/redis.service';
import { SessionService } from './services/session.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { TenantGuard } from './guards/tenant.guard';
import { TenantsModule } from '../modules/tenants/tenants.module';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig), TenantsModule],
  providers: [RedisService, SessionService, CacheInterceptor, TenantGuard],
  exports: [RedisService, SessionService, CacheInterceptor, TenantGuard],
})
export class CommonModule {}
