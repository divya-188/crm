import { Controller, Post, Get, Body, Query, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

@ApiTags('WhatsApp Webhooks')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly webhookService: WhatsAppWebhookService) {}

  @Get()
  @ApiOperation({ summary: 'Verify webhook (Meta API requirement)' })
  @ApiResponse({ status: 200, description: 'Webhook verified' })
  verifyWebhook(@Query() query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    this.logger.log(`Webhook verification request: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    return 'Verification failed';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook events from WhatsApp' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() body: any, @Req() req: Request) {
    this.logger.log('Received webhook event');
    this.logger.debug(JSON.stringify(body, null, 2));

    try {
      // Verify webhook signature (Meta API requirement)
      const signature = req.headers['x-hub-signature-256'] as string;
      if (signature) {
        const isValid = this.webhookService.verifySignature(
          JSON.stringify(body),
          signature,
        );
        if (!isValid) {
          this.logger.warn('Invalid webhook signature');
          return { status: 'error', message: 'Invalid signature' };
        }
      }

      // Process webhook
      await this.webhookService.processWebhook(body);

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { status: 'error', message: error.message };
    }
  }
}
