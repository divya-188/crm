import apiClient from '../lib/api-client';

export interface BillingInfo {
  companyName?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingEmail?: string;
}

export const billingSettingsService = {
  async getCurrentSubscription() {
    const response = await apiClient.get('/tenants/current/settings/billing/subscription');
    return response.data;
  },

  async getUsageStatistics() {
    const response = await apiClient.get('/tenants/current/settings/billing/usage');
    return response.data;
  },

  async getBillingInfo(): Promise<BillingInfo> {
    const response = await apiClient.get('/tenants/current/settings/billing/info');
    return response.data;
  },

  async updateBillingInfo(billingInfo: BillingInfo): Promise<BillingInfo> {
    const response = await apiClient.put('/tenants/current/settings/billing/info', billingInfo);
    return response.data;
  },

  async changePlan(planId: string) {
    const response = await apiClient.post('/tenants/current/settings/billing/change-plan', { planId });
    return response.data;
  },

  async cancelSubscription(reason: string) {
    const response = await apiClient.post('/tenants/current/settings/billing/cancel', { reason });
    return response.data;
  },

  async getBillingHistory(limit: number = 10) {
    const response = await apiClient.get(`/tenants/current/settings/billing/history?limit=${limit}`);
    return response.data;
  },

  async getPaymentMethod() {
    const response = await apiClient.get('/tenants/current/settings/billing/payment-method');
    return response.data;
  },

  async updatePaymentMethod(paymentMethodId: string) {
    const response = await apiClient.put('/tenants/current/settings/billing/payment-method', { paymentMethodId });
    return response.data;
  },
};
