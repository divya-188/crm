import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    private webhookDeliveryService: WebhookDeliveryService,
  ) {}

  /**
   * Available webhook events
   */
  private readonly AVAILABLE_EVENTS = [
    'message.new',
    'message.sent',
    'message.delivered',
    'message.read',
    'message.failed',
    'conversation.created',
    'conversation.updated',
    'conversation.assigned',
    'conversation.resolved',
    'conversation.closed',
    'contact.created',
    'contact.updated',
    'campaign.started',
    'campaign.completed',
    'campaign.failed',
    'flow.started',
    'flow.completed',
    'flow.failed',
    'automation.triggered',
    'automation.completed',
    'template.approved',
    'template.rejected',
    '*', // All events
  ];

  /**
   * Create a new webhook
   */
  async create(tenantId: string, createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    // Validate events
    const invalidEvents = createWebhookDto.events.filter(
      (event) => !this.AVAILABLE_EVENTS.includes(event),
    );

    if (invalidEvents.length > 0) {
      throw new BadRequestException(
        `Invalid events: ${invalidEvents.join(', ')}. Available events: ${this.AVAILABLE_EVENTS.join(', ')}`,
      );
    }

    // Generate secret if not provided
    const secret = createWebhookDto.secret || this.generateSecret();

    const webhook = this.webhookRepository.create({
      tenantId,
      name: createWebhookDto.name,
      url: createWebhookDto.url,
      events: createWebhookDto.events,
      secret,
      retryCount: createWebhookDto.retryCount ?? 3,
      timeoutSeconds: createWebhookDto.timeoutSeconds ?? 30,
      isActive: createWebhookDto.isActive ?? true,
      status: 'active',
    });

    return this.webhookRepository.save(webhook);
  }

  /**
   * Find all webhooks for a tenant with pagination
   */
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{ data: Webhook[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.webhookRepository.createQueryBuilder('webhook')
      .where('webhook.tenantId = :tenantId', { tenantId });

    if (status) {
      query.andWhere('webhook.status = :status', { status });
    }

    // Optimize query by selecting only necessary fields and using proper indexing
    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('webhook.createdAt', 'DESC')
      .getManyAndCount();

    // Calculate if there are more pages
    const hasMore = pageNum * limitNum < total;

    return { data, total, page: pageNum, limit: limitNum, hasMore };
  }

  /**
   * Find one webhook by ID
   */
  async findOne(tenantId: string, id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update a webhook
   */
  async update(
    tenantId: string,
    id: string,
    updateWebhookDto: UpdateWebhookDto,
  ): Promise<Webhook> {
    const webhook = await this.findOne(tenantId, id);

    // Validate events if provided
    if (updateWebhookDto.events) {
      const invalidEvents = updateWebhookDto.events.filter(
        (event) => !this.AVAILABLE_EVENTS.includes(event),
      );

      if (invalidEvents.length > 0) {
        throw new BadRequestException(
          `Invalid events: ${invalidEvents.join(', ')}. Available events: ${this.AVAILABLE_EVENTS.join(', ')}`,
        );
      }
    }

    Object.assign(webhook, updateWebhookDto);

    return this.webhookRepository.save(webhook);
  }

  /**
   * Delete a webhook
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const webhook = await this.findOne(tenantId, id);
    await this.webhookRepository.remove(webhook);
  }

  /**
   * Test a webhook
   */
  async testWebhook(
    tenantId: string,
    id: string,
    eventType: string,
    payload?: Record<string, any>,
  ): Promise<any> {
    const webhook = await this.findOne(tenantId, id);

    // Validate event type
    if (!this.AVAILABLE_EVENTS.includes(eventType)) {
      throw new BadRequestException(
        `Invalid event type: ${eventType}. Available events: ${this.AVAILABLE_EVENTS.join(', ')}`,
      );
    }

    // Use sample payload if not provided
    const testPayload = payload || this.getSamplePayload(eventType);

    // Deliver webhook
    await this.webhookDeliveryService.deliverToWebhook(webhook, eventType, testPayload);

    return {
      message: 'Webhook test initiated',
      eventType,
      payload: testPayload,
    };
  }

  /**
   * Get webhook logs
   */
  async getLogs(tenantId: string, id: string, limit: number = 50): Promise<any> {
    await this.findOne(tenantId, id); // Verify webhook exists

    return this.webhookDeliveryService.getWebhookLogs(tenantId, id, limit);
  }

  /**
   * Get webhook statistics
   */
  async getStats(tenantId: string, id: string): Promise<any> {
    await this.findOne(tenantId, id); // Verify webhook exists

    return this.webhookDeliveryService.getWebhookStats(tenantId, id);
  }

  /**
   * Get available events
   */
  getAvailableEvents(): string[] {
    return this.AVAILABLE_EVENTS;
  }

  /**
   * Generate a random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get sample payload for event type
   */
  private getSamplePayload(eventType: string): Record<string, any> {
    const samplePayloads: Record<string, any> = {
      'message.new': {
        messageId: 'msg_123456',
        conversationId: 'conv_123456',
        contactId: 'contact_123456',
        direction: 'inbound',
        type: 'text',
        content: 'Hello, this is a test message',
        timestamp: new Date().toISOString(),
      },
      'conversation.created': {
        conversationId: 'conv_123456',
        contactId: 'contact_123456',
        status: 'open',
        timestamp: new Date().toISOString(),
      },
      'campaign.completed': {
        campaignId: 'campaign_123456',
        name: 'Test Campaign',
        totalRecipients: 100,
        sentCount: 95,
        deliveredCount: 90,
        failedCount: 5,
        timestamp: new Date().toISOString(),
      },
      'flow.completed': {
        flowId: 'flow_123456',
        executionId: 'exec_123456',
        contactId: 'contact_123456',
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    };

    return (
      samplePayloads[eventType] || {
        event: eventType,
        message: 'This is a test webhook payload',
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Trigger webhook event (called by other services)
   */
  async triggerEvent(
    tenantId: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<void> {
    await this.webhookDeliveryService.deliverWebhook(tenantId, eventType, payload);
  }
}
