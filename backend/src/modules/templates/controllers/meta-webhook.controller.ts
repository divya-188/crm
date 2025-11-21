import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Headers, 
  Logger, 
  BadRequestException,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TemplatesService } from '../templates.service';
import { MetaTemplateApiService } from '../services/meta-template-api.service';
import { WebhookSignatureService } from '../../webhooks/services/webhook-signature.service';
import { MessageStatusService } from '../../webhooks/services/message-status.service';
import { IncomingMessageService } from '../../webhooks/services/incoming-message.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLog, WebhookEventType } from '../../webhooks/entities/webhook-log.entity';

/**
 * Meta Webhook Controller
 * Handles webhook notifications from Meta for all events
 */
@Controller('webhooks/meta')
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);

  constructor(
    private templatesService: TemplatesService,
    private metaTemplateApiService: MetaTemplateApiService,
    private webhookSignatureService: WebhookSignatureService,
    private messageStatusService: MessageStatusService,
    private incomingMessageService: IncomingMessageService,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
  ) {}

  /**
   * Webhook verification endpoint (required by Meta)
   */
  @Get()
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log('🔐 Webhook verification request received');
    
    // Get verify token from database (WhatsApp config)
    const verifyToken = await this.getWebhookVerifyToken();
    
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('✅ Webhook verified successfully');
      return challenge;
    }
    
    this.logger.error('❌ Webhook verification failed');
    this.logger.error(`Expected: ${verifyToken}, Received: ${token}`);
    throw new BadRequestException('Verification failed');
  }

  /**
   * Main webhook endpoint - handles all Meta events
   */
  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    this.logger.log('📨 ===== RECEIVED META WEBHOOK =====');
    this.logger.log(`Webhook body: ${JSON.stringify(body, null, 2)}`);

    // Verify signature
    const rawBody = JSON.stringify(body);
    const isValid = this.webhookSignatureService.verifySignature(rawBody, signature);
    
    if (!isValid) {
      this.logger.error('❌ Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    try {
      // Process webhook entries
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              await this.processWebhookChange(change);
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
   * Process webhook change based on field type
   */
  private async processWebhookChange(change: any): Promise<void> {
    const { field, value } = change;

    let eventType: WebhookEventType;
    let processed = false;
    let errorMessage: string | undefined;

    try {
      switch (field) {
        case 'messages':
          eventType = WebhookEventType.INCOMING_MESSAGE;
          await this.processIncomingMessage(value);
          processed = true;
          break;

        case 'message_template_status_update':
          eventType = WebhookEventType.TEMPLATE_STATUS;
          await this.processTemplateStatusUpdate(value);
          processed = true;
          break;

        case 'message_status':
          eventType = WebhookEventType.MESSAGE_STATUS;
          await this.processMessageStatus(value);
          processed = true;
          break;

        case 'account_update':
          eventType = WebhookEventType.ACCOUNT_UPDATE;
          await this.processAccountUpdate(value);
          processed = true;
          break;

        default:
          this.logger.warn(`Unknown webhook field: ${field}`);
          return;
      }

      // Log webhook event
      await this.logWebhookEvent(eventType, change, processed, errorMessage);
    } catch (error) {
      errorMessage = error.message;
      await this.logWebhookEvent(eventType, change, false, errorMessage);
      throw error;
    }
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(value: any): Promise<void> {
    this.logger.log('💬 ===== PROCESSING INCOMING MESSAGE =====');

    const messages = value.messages || [];
    const metadata = value.metadata;

    for (const message of messages) {
      this.logger.log(`   📱 From: ${message.from}`);
      this.logger.log(`   📝 Type: ${message.type}`);
      this.logger.log(`   🆔 Message ID: ${message.id}`);

      try {
        // Extract tenant ID from phone number ID or business account
        const tenantId = await this.getTenantIdFromPhoneNumber(metadata.phone_number_id);

        const messageData = {
          tenantId,
          metaMessageId: message.id,
          from: message.from,
          fromName: value.contacts?.[0]?.profile?.name,
          type: message.type,
          text: message.text?.body,
          media: this.extractMediaInfo(message),
          context: message.context,
          timestamp: parseInt(message.timestamp),
        };

        await this.incomingMessageService.saveIncomingMessage(messageData);
        this.logger.log(`✅ Incoming message processed: ${message.id}`);
      } catch (error) {
        this.logger.error(`Failed to process incoming message: ${error.message}`);
      }
    }
  }

  /**
   * Process message status update
   */
  private async processMessageStatus(value: any): Promise<void> {
    this.logger.log('📊 ===== PROCESSING MESSAGE STATUS =====');

    const statuses = value.statuses || [];

    for (const status of statuses) {
      this.logger.log(`   🆔 Message ID: ${status.id}`);
      this.logger.log(`   📊 Status: ${status.status}`);
      this.logger.log(`   ⏰ Timestamp: ${status.timestamp}`);

      try {
        const errorInfo = status.errors?.[0]
          ? {
              code: status.errors[0].code,
              message: status.errors[0].title,
            }
          : undefined;

        await this.messageStatusService.updateMessageStatus(
          status.id,
          status.status,
          parseInt(status.timestamp),
          errorInfo,
        );

        this.logger.log(`✅ Message status updated: ${status.id} -> ${status.status}`);
      } catch (error) {
        this.logger.error(`Failed to update message status: ${error.message}`);
      }
    }
  }

  /**
   * Process account update
   */
  private async processAccountUpdate(value: any): Promise<void> {
    this.logger.log('🔔 ===== PROCESSING ACCOUNT UPDATE =====');
    this.logger.log(`   Event: ${value.event}`);
    this.logger.log(`   Phone Number ID: ${value.phone_number_id}`);

    // Log account updates for monitoring
    // You can add email notifications or alerts here
    this.logger.warn(`Account update received: ${JSON.stringify(value, null, 2)}`);
  }

  /**
   * Extract media information from message
   */
  private extractMediaInfo(message: any): any {
    const mediaTypes = ['image', 'video', 'document', 'audio'];
    
    for (const type of mediaTypes) {
      if (message[type]) {
        return {
          type,
          id: message[type].id,
          mimeType: message[type].mime_type,
          caption: message[type].caption,
        };
      }
    }
    
    return null;
  }

  /**
   * Get webhook verify token from database
   */
  private async getWebhookVerifyToken(): Promise<string> {
    try {
      // Get from any active WhatsApp config (they should all have same verify token)
      const config = await this.metaTemplateApiService.getWhatsAppConfig('656b754d-0385-4401-a00b-ae8f4d3fe5e0');
      
      // Use webhookVerifyToken from database, fallback to default
      return config?.webhookVerifyToken || 'divya_whatsapp_verify_2025';
    } catch (error) {
      this.logger.warn('Could not get verify token from database, using default');
      return 'divya_whatsapp_verify_2025';
    }
  }

  /**
   * Get tenant ID from phone number ID
   */
  private async getTenantIdFromPhoneNumber(phoneNumberId: string): Promise<string> {
    try {
      // Query whatsapp_configs to find tenant by phone_number_id
      const config = await this.metaTemplateApiService.getConfigByPhoneNumberId(phoneNumberId);
      return config?.tenantId || '656b754d-0385-4401-a00b-ae8f4d3fe5e0';
    } catch (error) {
      this.logger.warn(`Could not find tenant for phone number ${phoneNumberId}, using default`);
      return '656b754d-0385-4401-a00b-ae8f4d3fe5e0';
    }
  }

  /**
   * Log webhook event to database
   */
  private async logWebhookEvent(
    eventType: WebhookEventType,
    payload: any,
    processed: boolean,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const log = this.webhookLogRepository.create({
        eventType,
        payload,
        processed,
        errorMessage,
        processedAt: processed ? new Date() : null,
      });

      await this.webhookLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to log webhook event: ${error.message}`);
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
