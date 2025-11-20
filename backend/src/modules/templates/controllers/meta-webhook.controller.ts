import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { TemplatesService } from '../templates.service';
import { MetaTemplateApiService } from '../services/meta-template-api.service';

/**
 * Meta Webhook Controller
 * Handles webhook notifications from Meta for template status updates
 */
@Controller('webhooks/meta')
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);

  constructor(
    private templatesService: TemplatesService,
    private metaTemplateApiService: MetaTemplateApiService,
  ) {}

  /**
   * Handle Meta webhook for template status updates
   */
  @Post('template-status')
  async handleTemplateStatusUpdate(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    this.logger.log('📨 ===== RECEIVED META WEBHOOK =====');
    this.logger.log(`Webhook body: ${JSON.stringify(body, null, 2)}`);
    this.logger.log(`Signature: ${signature}`);

    try {
      // Process template status updates
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === 'message_template_status_update') {
                await this.processTemplateStatusUpdate(change.value);
              }
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * Process individual template status update
   */
  private async processTemplateStatusUpdate(value: any) {
    this.logger.log(`🔄 ===== PROCESSING TEMPLATE STATUS UPDATE =====`);
    this.logger.log(`   📝 Template Name: ${value.message_template_name}`);
    this.logger.log(`   🆔 Template ID: ${value.message_template_id}`);
    this.logger.log(`   📊 Status Event: ${value.event}`);
    this.logger.log(`   ❌ Reason: ${value.reason || 'N/A'}`);

    try {
      // Find template by Meta template ID
      const template = await this.templatesService.findByMetaTemplateId(value.message_template_id);
      
      if (!template) {
        this.logger.warn(`⚠️ Template not found for Meta ID: ${value.message_template_id}`);
        return;
      }

      // Update template status based on Meta event
      let newStatus: string;
      let rejectionReason: string | undefined;

      switch (value.event) {
        case 'APPROVED':
          newStatus = 'approved';
          break;
        case 'REJECTED':
          newStatus = 'rejected';
          rejectionReason = value.reason;
          break;
        case 'PENDING':
          newStatus = 'pending';
          break;
        case 'DISABLED':
          newStatus = 'disabled';
          break;
        default:
          this.logger.warn(`Unknown template status event: ${value.event}`);
          return;
      }

      // Update template in database
      await this.templatesService.updateTemplateStatus(
        template.tenantId,
        template.id,
        newStatus,
        rejectionReason,
      );

      this.logger.log(`✅ Template ${template.name} status updated to: ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to process template status update: ${error.message}`);
    }
  }
}
