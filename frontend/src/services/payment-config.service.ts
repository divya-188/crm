import apiClient from '../lib/api-client';

export interface PaymentConfig {
  defaultProvider: string;
  paymentMode: string;
  availableProviders: string[];
}

export const paymentConfigService = {
  getConfig: async (): Promise<PaymentConfig> => {
    const response = await apiClient.get('/subscriptions/payment-config');
    return response.data.data || response.data;
  },
};
