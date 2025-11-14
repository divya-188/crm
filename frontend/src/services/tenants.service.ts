import apiClient from '../lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  settings?: Record<string, any>;
  limits?: {
    maxUsers?: number;
    maxContacts?: number;
    maxMessages?: number;
    maxWhatsAppConnections?: number;
  };
  subscriptionPlanId?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface TenantListResponse {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTenantData {
  name: string;
  slug?: string;
  domain?: string;
  subscriptionPlanId?: string;
  settings?: Record<string, any>;
  limits?: {
    maxUsers?: number;
    maxContacts?: number;
    maxMessages?: number;
    maxWhatsAppConnections?: number;
  };
}

export interface UpdateTenantData extends Partial<CreateTenantData> {
  status?: string;
}

export const tenantsService = {
  // Get all tenants with pagination and filters
  async getAll(query?: TenantQuery): Promise<TenantListResponse> {
    // Filter out empty string values
    const params = query ? Object.fromEntries(
      Object.entries(query).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    ) : {};
    
    const response = await apiClient.get('/tenants', { params });
    return response.data;
  },

  // Get single tenant by ID
  async getById(id: string): Promise<Tenant> {
    const response = await apiClient.get(`/tenants/${id}`);
    return response.data;
  },

  // Get tenant statistics
  async getStats(id: string): Promise<any> {
    const response = await apiClient.get(`/tenants/${id}/stats`);
    return response.data;
  },

  // Create new tenant
  async create(data: CreateTenantData): Promise<Tenant> {
    const response = await apiClient.post('/tenants', data);
    return response.data;
  },

  // Update tenant
  async update(id: string, data: UpdateTenantData): Promise<Tenant> {
    const response = await apiClient.patch(`/tenants/${id}`, data);
    return response.data;
  },

  // Update tenant status
  async updateStatus(id: string, status: string): Promise<Tenant> {
    const response = await apiClient.patch(`/tenants/${id}/status`, { status });
    return response.data;
  },

  // Update tenant settings
  async updateSettings(id: string, settings: Record<string, any>): Promise<Tenant> {
    const response = await apiClient.patch(`/tenants/${id}/settings`, settings);
    return response.data;
  },

  // Delete tenant
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tenants/${id}`);
  },
};
