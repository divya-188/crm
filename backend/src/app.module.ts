import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { FlowsModule } from './modules/flows/flows.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,    // Time window in milliseconds (60 seconds)
      limit: 100,    // Max requests per window
    }]),
    ScheduleModule.forRoot(),
    CommonModule,
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    ContactsModule,
    ConversationsModule,
    WebSocketModule,
    WhatsAppModule,
    TemplatesModule,
    CampaignsModule,
    FlowsModule,
    AutomationsModule,
    AnalyticsModule,
    SubscriptionsModule,
    ApiKeysModule,
    PublicApiModule,
    WebhooksModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
