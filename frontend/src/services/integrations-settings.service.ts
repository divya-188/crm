import apiClient from '../lib/api-client';

export interface IntegrationSettings {
  oauth?: {
    google?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };
    microsoft?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };
  };
  apiKeys?: {
    enabled: boolean;
    maxKeys?: number;
  };
  webhooks?: {
    enabled: boolean;
    maxWebhooks?: number;
  };
  thirdParty?: {
    zapier?: {
      enabled: boolean;
      apiKey?: string;
    };
    slack?: {
      enabled: boolean;
      webhookUrl?: string;
    };
  };
}

export const integrationsSettingsService = {
  async getSettings(): Promise<IntegrationSettings> {
    const response = await apiClient.get('/tenants/current/settings/integrations');
    return response.data;
  },

  async updateSettings(settings: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    const response = await apiClient.put('/tenants/current/settings/integrations', settings);
    return response.data;
  },
};
