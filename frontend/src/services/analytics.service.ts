import apiClient from '@/lib/api-client';
import { DashboardMetrics } from '@/types/models.types';
import { DateRange } from '@/types/api.types';

interface ConversationAnalytics {
  totalConversations: number;
  newConversations: number;
  resolvedConversations: number;
  averageResolutionTime: number;
  conversationsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  conversationTrend: Array<{
    date: string;
    count: number;
  }>;
}

interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessagesSent: number;
  averageDeliveryRate: number;
  averageReadRate: number;
  campaignPerformance: Array<{
    campaignId: string;
    campaignName: string;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    deliveryRate: number;
    readRate: number;
  }>;
}

interface AgentAnalytics {
  totalAgents: number;
  activeAgents: number;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    conversationsHandled: number;
    averageResponseTime: number;
    resolutionRate: number;
    customerSatisfaction?: number;
  }>;
}

class AnalyticsService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(dateRange?: DateRange): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>('/analytics/dashboard', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(dateRange?: DateRange): Promise<ConversationAnalytics> {
    const response = await apiClient.get<ConversationAnalytics>('/analytics/conversations', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(dateRange?: DateRange): Promise<CampaignAnalytics> {
    const response = await apiClient.get<CampaignAnalytics>('/analytics/campaigns', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get agent analytics
   */
  async getAgentAnalytics(dateRange?: DateRange): Promise<AgentAnalytics> {
    const response = await apiClient.get<AgentAnalytics>('/analytics/agents', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get flow analytics
   */
  async getFlowAnalytics(dateRange?: DateRange): Promise<any> {
    const response = await apiClient.get('/analytics/flows', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    type: 'conversations' | 'campaigns' | 'agents' | 'flows',
    dateRange?: DateRange,
    format: 'csv' | 'pdf' = 'csv'
  ): Promise<Blob> {
    const response = await apiClient.get('/analytics/export', {
      params: {
        type,
        format,
        ...dateRange,
      },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
