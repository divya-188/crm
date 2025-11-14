import apiClient from '../lib/api-client';

export interface PlanFeatures {
  maxContacts: number;
  maxUsers: number;
  maxConversations: number;
  maxCampaigns: number;
  maxFlows: number;
  maxAutomations: number;
  maxTemplates?: number;
  maxApiKeys?: number;
  maxWebhooks?: number;
  whatsappConnections: number;
  apiAccess: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  hasAdvancedAnalytics?: boolean;
  hasCustomBranding?: boolean;
  hasPrioritySupport?: boolean;
  hasApiAccess?: boolean;
  [key: string]: number | boolean | undefined; // Index signature for dynamic access
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  features: PlanFeatures;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanData {
  name: string;
  description?: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  features: PlanFeatures;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanData extends Partial<CreatePlanData> {}

export const subscriptionPlansService = {
  // Get all plans
  async getAll(includeInactive = false): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get('/subscription-plans', {
      params: { includeInactive: includeInactive.toString() },
    });
    // Handle paginated response
    return response.data.data || response.data;
  },

  // Get single plan by ID
  async getById(id: string): Promise<SubscriptionPlan> {
    const response = await apiClient.get(`/subscription-plans/${id}`);
    return response.data;
  },

  // Get plan comparison data
  async compare(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get('/subscription-plans/compare');
    return response.data;
  },

  // Check if plan has a specific feature
  async checkFeature(id: string, feature: string): Promise<boolean> {
    const response = await apiClient.get(`/subscription-plans/${id}/check-feature/${feature}`);
    return response.data;
  },

  // Check plan limit for a specific key
  async checkLimit(id: string, limitKey: string): Promise<number> {
    const response = await apiClient.get(`/subscription-plans/${id}/check-limit/${limitKey}`);
    return response.data;
  },

  // Create new plan
  async create(data: CreatePlanData): Promise<SubscriptionPlan> {
    const response = await apiClient.post('/subscription-plans', data);
    return response.data;
  },

  // Update plan
  async update(id: string, data: UpdatePlanData): Promise<SubscriptionPlan> {
    const response = await apiClient.patch(`/subscription-plans/${id}`, data);
    return response.data;
  },

  // Delete plan
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/subscription-plans/${id}`);
  },
};
