import apiClient from '../lib/api-client';

export interface WhatsAppConfig {
  id?: string;
  name: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookSecret: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected' | 'pending';
  isActive: boolean;
  lastTestedAt?: string;
  testResult?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWhatsAppConfigDto {
  name: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookSecret?: string;
  webhookUrl?: string;
  isActive?: boolean;
}

export interface UpdateWhatsAppConfigDto {
  name?: string;
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  isActive?: boolean;
}

class WhatsAppSettingsService {
  private baseUrl = '/settings/whatsapp';

  async getConfig(): Promise<WhatsAppConfig | null> {
    const response = await apiClient.get<WhatsAppConfig>(this.baseUrl);
    return response.data;
  }

  async createConfig(data: CreateWhatsAppConfigDto): Promise<WhatsAppConfig> {
    const response = await apiClient.post<WhatsAppConfig>(this.baseUrl, data);
    return response.data;
  }

  async updateConfig(data: UpdateWhatsAppConfigDto): Promise<WhatsAppConfig> {
    const response = await apiClient.put<WhatsAppConfig>(this.baseUrl, data);
    return response.data;
  }

  async deleteConfig(): Promise<void> {
    await apiClient.delete(this.baseUrl);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/test`
    );
    return response.data;
  }

  async testConnectionWithData(data: { accessToken: string; phoneNumberId: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/test-with-data`,
      data
    );
    return response.data;
  }

  async regenerateSecret(): Promise<WhatsAppConfig> {
    const response = await apiClient.post<WhatsAppConfig>(
      `${this.baseUrl}/regenerate-secret`
    );
    return response.data;
  }
}

export default new WhatsAppSettingsService();
