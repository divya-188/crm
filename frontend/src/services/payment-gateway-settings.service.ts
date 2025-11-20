import { apiClient } from '../lib/api-client';

export interface PaymentGatewayConfig {
  stripe?: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal?: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  razorpay?: {
    enabled: boolean;
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
}

class PaymentGatewaySettingsService {
  private baseUrl = '/super-admin/settings/payment-gateway';

  async getSettings(): Promise<PaymentGatewayConfig> {
    const response = await apiClient.get(this.baseUrl);
    return response.data;
  }

  async updateSettings(config: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const response = await apiClient.put(this.baseUrl, config);
    return response.data;
  }

  async testConnection(
    provider: 'stripe' | 'paypal' | 'razorpay',
    credentials: any
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/test-connection`, {
      provider,
      credentials,
    });
    return response.data;
  }
}

export const paymentGatewaySettingsService = new PaymentGatewaySettingsService();
