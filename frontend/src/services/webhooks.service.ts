import apiClient from '@/lib/api-client';
import {
  Webhook,
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookLog,
  WebhookStats,
  TestWebhookDto,
} from '@/types/models.types';

class WebhooksService {
  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    const response = await apiClient.get<{ data: Webhook[] }>('/webhooks');
    return response.data.data;
  }

  /**
   * Get a single webhook by ID
   */
  async getWebhook(id: string): Promise<Webhook> {
    const response = await apiClient.get<{ data: Webhook }>(`/webhooks/${id}`);
    return response.data.data;
  }

  /**
   * Create a new webhook
   */
  async createWebhook(data: CreateWebhookDto): Promise<Webhook> {
    const response = await apiClient.post<{ data: Webhook }>('/webhooks', data);
    return response.data.data;
  }

  /**
   * Update a webhook
   */
  async updateWebhook(id: string, data: UpdateWebhookDto): Promise<Webhook> {
    const response = await apiClient.patch<{ data: Webhook }>(`/webhooks/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await apiClient.delete(`/webhooks/${id}`);
  }

  /**
   * Test a webhook
   */
  async testWebhook(id: string, data: TestWebhookDto): Promise<any> {
    const response = await apiClient.post(`/webhooks/${id}/test`, data);
    return response.data;
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(id: string, limit?: number): Promise<WebhookLog[]> {
    const response = await apiClient.get<{ data: WebhookLog[] }>(`/webhooks/${id}/logs`, {
      params: { limit },
    });
    return response.data.data;
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(id: string): Promise<WebhookStats> {
    const response = await apiClient.get<{ data: WebhookStats }>(`/webhooks/${id}/stats`);
    return response.data.data;
  }

  /**
   * Get available webhook events
   */
  async getAvailableEvents(): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>('/webhooks/events');
    return response.data.data;
  }
}

export const webhooksService = new WebhooksService();
