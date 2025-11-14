import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { WebhookLog } from '../entities/webhook-log.entity';
import * as crypto from 'crypto';
import axios, { AxiosError } from 'axios';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
  ) {}

  /**
   * Deliver webhook to all registered webhooks for a specific event
   */
  async deliverWebhook(
    tenantId: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await this.webhookRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const subscribedWebhooks = webhooks.filter((webhook) =>
      webhook.events.includes(eventType) || webhook.events.includes('*'),
    );

    if (subscribedWebhooks.length === 0) {
      this.logger.debug(`No webhooks subscribed to event: ${eventType} for tenant: ${tenantId}`);
      return;
    }

    // Deliver to each webhook
    const deliveryPromises = subscribedWebhooks.map((webhook) =>
      this.deliverToWebhook(webhook, eventType, payload),
    );

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver webhook to a specific webhook endpoint
   */
  async deliverToWebhook(
    webhook: Webhook,
    eventType: string,
    payload: Record<string, any>,
    attemptNumber: number = 1,
  ): Promise<void> {
    const startTime = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let isSuccess = false;

    try {
      // Prepare webhook payload
      const webhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      // Generate signature if secret is configured
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-CRM-Webhook/1.0',
        'X-Webhook-Event': eventType,
      };

      if (webhook.secret) {
        const signature = this.generateSignature(webhookPayload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Send HTTP POST request
      const response = await axios.post(webhook.url, webhookPayload, {
        headers,
        timeout: webhook.timeoutSeconds * 1000,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      responseStatus = response.status;
      responseBody = JSON.stringify(response.data);
      isSuccess = true;

      // Update webhook statistics
      await this.updateWebhookStats(webhook.id, true);

      this.logger.log(
        `Webhook delivered successfully to ${webhook.url} for event ${eventType}`,
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        responseStatus = axiosError.response.status;
        responseBody = JSON.stringify(axiosError.response.data);
        errorMessage = `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`;
      } else if (axiosError.request) {
        errorMessage = 'No response received from webhook endpoint';
      } else {
        errorMessage = axiosError.message || 'Unknown error';
      }

      this.logger.error(
        `Webhook delivery failed to ${webhook.url} for event ${eventType}: ${errorMessage}`,
      );

      // Update webhook statistics
      await this.updateWebhookStats(webhook.id, false);

      // Retry if attempts remaining
      if (attemptNumber < webhook.retryCount) {
        const delay = this.calculateBackoffDelay(attemptNumber);
        this.logger.log(
          `Retrying webhook delivery in ${delay}ms (attempt ${attemptNumber + 1}/${webhook.retryCount})`,
        );

        await this.sleep(delay);
        return this.deliverToWebhook(webhook, eventType, payload, attemptNumber + 1);
      }
    } finally {
      const responseTimeMs = Date.now() - startTime;

      // Log webhook delivery
      await this.logWebhookDelivery({
        tenantId: webhook.tenantId,
        webhookId: webhook.id,
        eventType,
        payload,
        responseStatus,
        responseBody,
        responseTimeMs,
        errorMessage,
        attemptCount: attemptNumber,
        isSuccess,
      });
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Update webhook statistics
   */
  private async updateWebhookStats(webhookId: string, isSuccess: boolean): Promise<void> {
    const updateData: any = {
      lastTriggeredAt: new Date(),
      totalDeliveries: () => 'total_deliveries + 1',
    };

    if (isSuccess) {
      updateData.successfulDeliveries = () => 'successful_deliveries + 1';
    } else {
      updateData.failedDeliveries = () => 'failed_deliveries + 1';
    }

    await this.webhookRepository.update(webhookId, updateData);
  }

  /**
   * Log webhook delivery
   */
  private async logWebhookDelivery(logData: {
    tenantId: string;
    webhookId: string;
    eventType: string;
    payload: Record<string, any>;
    responseStatus: number | null;
    responseBody: string | null;
    responseTimeMs: number;
    errorMessage: string | null;
    attemptCount: number;
    isSuccess: boolean;
  }): Promise<void> {
    const log = this.webhookLogRepository.create(logData);
    await this.webhookLogRepository.save(log);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    // Exponential backoff: 2^attempt * 1000ms (1s, 2s, 4s, 8s, etc.)
    return Math.pow(2, attemptNumber) * 1000;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    tenantId: string,
    webhookId: string,
    limit: number = 50,
  ): Promise<WebhookLog[]> {
    return this.webhookLogRepository.find({
      where: { tenantId, webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get webhook delivery statistics
   */
  async getWebhookStats(tenantId: string, webhookId: string): Promise<any> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId, tenantId },
    });

    if (!webhook) {
      return null;
    }

    const successRate =
      webhook.totalDeliveries > 0
        ? (webhook.successfulDeliveries / webhook.totalDeliveries) * 100
        : 0;

    // Get average response time from recent logs
    const recentLogs = await this.webhookLogRepository
      .createQueryBuilder('log')
      .where('log.webhook_id = :webhookId', { webhookId })
      .andWhere('log.tenant_id = :tenantId', { tenantId })
      .andWhere('log.is_success = :isSuccess', { isSuccess: true })
      .orderBy('log.created_at', 'DESC')
      .limit(100)
      .getMany();

    const avgResponseTime =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) /
          recentLogs.length
        : 0;

    return {
      totalDeliveries: webhook.totalDeliveries,
      successfulDeliveries: webhook.successfulDeliveries,
      failedDeliveries: webhook.failedDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTimeMs: Math.round(avgResponseTime),
      lastTriggeredAt: webhook.lastTriggeredAt,
    };
  }
}
