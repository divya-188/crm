import apiClient from '@/lib/api-client';
import { Campaign, CreateCampaignDto } from '@/types/models.types';
import { PaginatedResponse, QueryOptions } from '@/types/api.types';

interface CampaignStats {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  deliveryRate: number;
  readRate: number;
}

class CampaignsService {
  /**
   * Get all campaigns
   */
  async getCampaigns(options?: QueryOptions): Promise<PaginatedResponse<Campaign>> {
    const response = await apiClient.get<PaginatedResponse<Campaign>>('/campaigns', {
      params: options,
    });
    return response.data;
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.get<Campaign>(`/campaigns/${id}`);
    return response.data;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignDto): Promise<Campaign> {
    const response = await apiClient.post<Campaign>('/campaigns', data);
    return response.data;
  }

  /**
   * Update a campaign
   */
  async updateCampaign(id: string, data: Partial<CreateCampaignDto>): Promise<Campaign> {
    const response = await apiClient.patch<Campaign>(`/campaigns/${id}`, data);
    return response.data;
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete(`/campaigns/${id}`);
  }

  /**
   * Schedule a campaign
   */
  async scheduleCampaign(id: string, scheduledAt: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/schedule`, {
      scheduledAt,
    });
    return response.data;
  }

  /**
   * Start a campaign immediately
   */
  async startCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/start`);
    return response.data;
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/pause`);
    return response.data;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(id: string): Promise<CampaignStats> {
    const response = await apiClient.get<CampaignStats>(`/campaigns/${id}/stats`);
    return response.data;
  }

  /**
   * Get campaign messages
   */
  async getCampaignMessages(id: string, options?: QueryOptions): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/campaigns/${id}/messages`,
      {
        params: options,
      }
    );
    return response.data;
  }

  /**
   * Duplicate a campaign
   */
  async duplicateCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/duplicate`);
    return response.data;
  }
}

export const campaignsService = new CampaignsService();
