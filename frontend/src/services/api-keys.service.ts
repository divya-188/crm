import apiClient from '@/lib/api-client';
import {
  ApiKey,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  ApiKeyUsageStats,
  ApiKeyWithPlainKey,
} from '@/types/models.types';

class ApiKeysService {
  /**
   * Get all API keys with pagination
   */
  async getApiKeys(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: ApiKey[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const response = await apiClient.get<{ 
      data: ApiKey[]; 
      total: number; 
      page: number; 
      limit: number;
      hasMore: boolean;
    }>('/api-keys', {
      params,
    });
    
    return {
      data: response.data.data,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      hasMore: response.data.hasMore,
    };
  }

  /**
   * Get a single API key by ID
   */
  async getApiKey(id: string): Promise<ApiKey> {
    const response = await apiClient.get<{ data: ApiKey }>(`/api-keys/${id}`);
    return response.data.data;
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: CreateApiKeyDto): Promise<ApiKeyWithPlainKey> {
    const response = await apiClient.post<{ message: string; apiKey: ApiKeyWithPlainKey }>('/api-keys', data);
    // Return the full response so we can show the message and key
    return response.data.apiKey;
  }

  /**
   * Update an API key
   */
  async updateApiKey(id: string, data: UpdateApiKeyDto): Promise<ApiKey> {
    const response = await apiClient.patch<{ data: ApiKey }>(`/api-keys/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string): Promise<void> {
    await apiClient.delete(`/api-keys/${id}`);
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyUsage(id: string): Promise<ApiKeyUsageStats> {
    const response = await apiClient.get<{ data: ApiKeyUsageStats }>(`/api-keys/${id}/usage`);
    return response.data.data;
  }
}

export const apiKeysService = new ApiKeysService();
