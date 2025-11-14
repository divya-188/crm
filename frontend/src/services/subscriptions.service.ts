import apiClient from '../lib/api-client';

export const subscriptionsService = {
  getCurrentSubscription: async () => {
    return apiClient.get('/subscriptions/current');
  },

  getUsageStatistics: async () => {
    return apiClient.get('/subscriptions/usage');
  },

  createSubscription: async (data: {
    planId: string;
    paymentProvider: string;
    paymentMethodId?: string;
  }) => {
    return apiClient.post('/subscriptions', data);
  },

  renewSubscription: async (subscriptionId: string) => {
    return apiClient.post(`/subscriptions/${subscriptionId}/renew`, {});
  },

  upgradeSubscription: async (
    subscriptionId: string,
    data: {
      newPlanId: string;
      paymentProvider: string;
      paymentMethodId?: string;
    },
  ) => {
    return apiClient.patch(`/subscriptions/${subscriptionId}/upgrade`, data);
  },

  downgradeSubscription: async (
    subscriptionId: string,
    data: {
      newPlanId: string;
    },
  ) => {
    return apiClient.patch(`/subscriptions/${subscriptionId}/downgrade`, data);
  },

  cancelSubscription: async (
    subscriptionId: string,
    data: {
      cancellationReason?: string;
      cancelImmediately?: boolean;
    },
  ) => {
    return apiClient.delete(`/subscriptions/${subscriptionId}`, { data });
  },

  reactivateSubscription: async (
    subscriptionId: string,
    data?: {
      paymentMethodId?: string;
    },
  ) => {
    return apiClient.post(`/subscriptions/${subscriptionId}/reactivate`, data);
  },

  getInvoices: async () => {
    return apiClient.get('/subscriptions/invoices');
  },

  getInvoice: async (invoiceId: string) => {
    return apiClient.get(`/subscriptions/invoices/${invoiceId}`);
  },

  downloadInvoice: async (invoiceId: string) => {
    const response = await apiClient.get(`/subscriptions/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response;
  },

  getUsage: async () => {
    return apiClient.get('/subscriptions/usage');
  },

  upgradePlan: async (subscriptionId: string, newPlanId: string) => {
    return apiClient.patch(`/subscriptions/${subscriptionId}/upgrade`, {
      newPlanId,
      paymentProvider: 'stripe',
    });
  },

  downgradePlan: async (subscriptionId: string, newPlanId: string) => {
    return apiClient.patch(`/subscriptions/${subscriptionId}/downgrade`, {
      newPlanId,
    });
  },
};
