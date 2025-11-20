import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Template } from './entities/template.entity';
import { TemplateStatusHistory } from './entities/template-status-history.entity';
import { TemplateTestSend } from './entities/template-test-send.entity';
import { TestPhoneNumber } from './entities/test-phone-number.entity';
import { TemplateUsageAnalytics } from './entities/template-usage-analytics.entity';
import { TemplateAuditLog } from './entities/template-audit-log.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { WhatsAppConfig } from '../tenants/entities/whatsapp-config.entity';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplateOptimizationController } from './controllers/template-optimization.controller';
import { MetaWebhookController } from './controllers/meta-webhook.controller';
import { TemplateValidationEngine } from './services/template-validation.engine';
import { MetaApiClientService } from './services/meta-api-client.service';
import { MetaTemplateApiService } from './services/meta-template-api.service';
import { TemplateMediaService } from './services/template-media.service';
import { TemplateStatusPollerService } from './services/template-status-poller.service';
import { TemplateStatusHistoryService } from './services/template-status-history.service';
import { TemplatePreviewService } from './services/template-preview.service';
import { TemplateTestingService } from './services/template-testing.service';
import { TemplateAnalyticsService } from './services/template-analytics.service';
import { TemplateAnalyticsAggregationService } from './services/template-analytics-aggregation.service';
import { TemplateImportExportService } from './services/template-import-export.service';
import { TemplateAuditService } from './services/template-audit.service';
import { TemplateErrorLoggerService } from './services/template-error-logger.service';
import { TemplateRetryService } from './services/template-retry.service';
import { TemplateCacheService } from './services/template-cache.service';
import { TemplatePermissionsGuard } from './guards/template-permissions.guard';
import { TemplateVisibilityGuard } from './guards/template-visibility.guard';
import { TemplateCursorPaginationService } from './services/template-cursor-pagination.service';
import { TemplateQueryOptimizerService } from './services/template-query-optimizer.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Template,
      TemplateStatusHistory,
      TemplateTestSend,
      TestPhoneNumber,
      TemplateUsageAnalytics,
      TemplateAuditLog,
      Campaign,
      WhatsAppConfig,
    ]),
    BullModule.registerQueue({
      name: 'template-status',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
      },
    }),
    CommonModule,
  ],
  controllers: [TemplatesController, TemplateOptimizationController, MetaWebhookController],
  providers: [
    TemplatesService,
    TemplateValidationEngine,
    MetaApiClientService,
    MetaTemplateApiService,
    TemplateMediaService,
    TemplateStatusPollerService,
    TemplateStatusHistoryService,
    TemplatePreviewService,
    TemplateTestingService,
    TemplateAnalyticsService,
    TemplateAnalyticsAggregationService,
    TemplateImportExportService,
    TemplateAuditService,
    TemplateErrorLoggerService,
    TemplateRetryService,
    TemplateCacheService,
    TemplatePermissionsGuard,
    TemplateVisibilityGuard,
    TemplateCursorPaginationService,
    TemplateQueryOptimizerService,
  ],
  exports: [
    TemplatesService,
    TemplateValidationEngine,
    MetaApiClientService,
    TemplateMediaService,
    TemplateStatusPollerService,
    TemplateStatusHistoryService,
    TemplatePreviewService,
    TemplateTestingService,
    TemplateAnalyticsService,
    TemplateAnalyticsAggregationService,
    TemplateImportExportService,
    TemplateAuditService,
    TemplateErrorLoggerService,
    TemplateRetryService,
    TemplateCacheService,
    TemplateCursorPaginationService,
    TemplateQueryOptimizerService,
  ],
})
export class TemplatesModule {}
