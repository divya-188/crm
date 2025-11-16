import apiClient from '../lib/api-client';

export const subscriptionsService = {
  getCurrentSubscription: async () => {
    const response = await apiClient.get('/subscriptions/current');
    return response.data;
  },

  getUsageStatistics: async () => {
    const response = await apiClient.get('/subscriptions/usage');
    return response.data;
  },

  createSubscription: async (data: {
    planId: string;
    paymentProvider: string;
    paymentMethodId?: string;
  }) => {
    const response = await apiClient.post('/subscriptions', data);
    return response.data;
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
    const response = await apiClient.get('/subscriptions/invoices');
    return response.data;
  },

  getInvoice: async (invoiceId: string) => {
    const response = await apiClient.get(`/subscriptions/invoices/${invoiceId}`);
    return response.data;
  },

  downloadInvoice: async (invoiceId: string) => {
    try {
      const response = await apiClient.get(`/subscriptions/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      
      // The response.data contains the blob
      const blob = response.data || response;
      
      // Verify it's a valid blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      // Check if blob is not empty
      if (blob.size === 0) {
        throw new Error('Received empty file');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return response;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw new Error('Failed to download invoice. Please try again.');
    }
  },

  getUsage: async () => {
    const response = await apiClient.get('/subscriptions/usage');
    return response.data;
  },

  upgradePlan: async (subscriptionId: string, newPlanId: string, paymentProvider?: string) => {
    // Get payment provider from config if not provided
    const provider = paymentProvider || localStorage.getItem('paymentProvider') || 'razorpay';
    
    console.log('📡 [API] Calling upgrade endpoint');
    console.log('📡 [API] URL:', `/subscriptions/${subscriptionId}/upgrade`);
    console.log('📡 [API] Payload:', { newPlanId, paymentProvider: provider });
    
    const response = await apiClient.patch(`/subscriptions/${subscriptionId}/upgrade`, {
      newPlanId,
      paymentProvider: provider,
    });
    
    console.log('📡 [API] Response status:', response.status);
    console.log('📡 [API] Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  },

  downgradePlan: async (subscriptionId: string, newPlanId: string) => {
    const response = await apiClient.patch(`/subscriptions/${subscriptionId}/downgrade`, {
      newPlanId,
    });
    return response.data;
  },
};
