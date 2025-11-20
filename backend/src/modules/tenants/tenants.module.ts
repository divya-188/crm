import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { WhatsAppConfig } from './entities/whatsapp-config.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { WhatsAppConfigService } from './services/whatsapp-config.service';
import { WhatsAppConfigController } from './controllers/whatsapp-config.controller';
import { TenantBrandingService } from './services/tenant-branding.service';
import { TenantBrandingController } from './controllers/tenant-branding.controller';
import { TeamSettingsService } from './services/team-settings.service';
import { TeamSettingsController } from './controllers/team-settings.controller';
import { IntegrationsSettingsService } from './services/integrations-settings.service';
import { IntegrationsSettingsController } from './controllers/integrations-settings.controller';
import { BillingSettingsService } from './services/billing-settings.service';
import { BillingSettingsController } from './controllers/billing-settings.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { CommonModule } from '../../common/common.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, WhatsAppConfig]),
    WhatsAppModule,
    CommonModule,
    SuperAdminModule,
    SubscriptionsModule,
  ],
  controllers: [
    TenantsController,
    WhatsAppConfigController,
    TenantBrandingController,
    TeamSettingsController,
    IntegrationsSettingsController,
    BillingSettingsController,
  ],
  providers: [
    TenantsService,
    WhatsAppConfigService,
    TenantBrandingService,
    TeamSettingsService,
    IntegrationsSettingsService,
    BillingSettingsService,
  ],
  exports: [
    TenantsService,
    WhatsAppConfigService,
    TenantBrandingService,
    TeamSettingsService,
    IntegrationsSettingsService,
    BillingSettingsService,
  ],
})
export class TenantsModule {}
