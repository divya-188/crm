import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { PaymentGatewaySettingsController } from './controllers/payment-gateway-settings.controller';
import { EmailSettingsController } from './controllers/email-settings.controller';
import { PlatformBrandingController } from './controllers/platform-branding.controller';
import { SecuritySettingsController } from './controllers/security-settings.controller';
import { PaymentGatewaySettingsService } from './services/payment-gateway-settings.service';
import { EmailSettingsService } from './services/email-settings.service';
import { PlatformBrandingService } from './services/platform-branding.service';
import { SecuritySettingsService } from './services/security-settings.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { PlatformSettings } from './entities/platform-settings.entity';
import { CommonModule } from '../../common/common.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, PlatformSettings]),
    CommonModule,
    forwardRef(() => WebSocketModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [
    SuperAdminController,
    PaymentGatewaySettingsController,
    EmailSettingsController,
    PlatformBrandingController,
    SecuritySettingsController,
  ],
  providers: [
    SuperAdminService,
    PaymentGatewaySettingsService,
    EmailSettingsService,
    PlatformBrandingService,
    SecuritySettingsService,
  ],
  exports: [
    SuperAdminService,
    PaymentGatewaySettingsService,
    EmailSettingsService,
    PlatformBrandingService,
    SecuritySettingsService,
  ],
})
export class SuperAdminModule {}
