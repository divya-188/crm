import apiClient from '@/lib/api-client';
import { Flow, CreateFlowDto } from '@/types/models.types';
import { PaginatedResponse, QueryOptions } from '@/types/api.types';

interface FlowAnalytics {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  completionRate: number;
  averageExecutionTime: number;
  dropOffPoints: Array<{
    nodeId: string;
    nodeName: string;
    dropOffCount: number;
  }>;
}

class FlowsService {
  /**
   * Get all flows
   */
  async getFlows(options?: QueryOptions): Promise<PaginatedResponse<Flow>> {
    const response = await apiClient.get<PaginatedResponse<Flow>>('/flows', {
      params: options,
    });
    return response.data;
  }

  /**
   * Get a single flow by ID
   */
  async getFlow(id: string): Promise<Flow> {
    const response = await apiClient.get<Flow>(`/flows/${id}`);
    return response.data;
  }

  /**
   * Create a new flow
   */
  async createFlow(data: CreateFlowDto): Promise<Flow> {
    console.log('FlowsService: Creating flow with data:', data);
    const response = await apiClient.post<Flow>('/flows', data);
    console.log('FlowsService: Flow created successfully:', response.data);
    return response.data;
  }

  /**
   * Update a flow
   */
  async updateFlow(id: string, data: Partial<CreateFlowDto>): Promise<Flow> {
    console.log('FlowsService: Updating flow', id, 'with data:', data);
    const response = await apiClient.patch<Flow>(`/flows/${id}`, data);
    console.log('FlowsService: Flow updated successfully:', response.data);
    return response.data;
  }

  /**
   * Delete a flow
   */
  async deleteFlow(id: string): Promise<void> {
    await apiClient.delete(`/flows/${id}`);
  }

  /**
   * Test a flow in sandbox mode
   */
  async testFlow(id: string, testData?: any): Promise<{
    success: boolean;
    executionPath: string[];
    logs: Array<{
      timestamp: string;
      nodeId: string;
      nodeName: string;
      nodeType: string;
      action: string;
      data: any;
      duration: number;
    }>;
    finalContext: Record<string, any>;
    error?: string;
  }> {
    const response = await apiClient.post(
      `/flows/${id}/test`,
      { testData }
    );
    return response.data;
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId: string): Promise<any> {
    const response = await apiClient.get(`/flows/executions/${executionId}/logs`);
    return response.data;
  }

  /**
   * Get execution replay data
   */
  async getExecutionReplay(executionId: string): Promise<any> {
    const response = await apiClient.get(`/flows/executions/${executionId}/replay`);
    return response.data;
  }

  /**
   * Update flow status (activate/deactivate)
   */
  async updateFlowStatus(id: string, status: 'active' | 'inactive'): Promise<Flow> {
    const response = await apiClient.patch<Flow>(`/flows/${id}/status`, { status });
    return response.data;
  }

  /**
   * Get flow analytics
   */
  async getFlowAnalytics(id: string): Promise<FlowAnalytics> {
    const response = await apiClient.get<FlowAnalytics>(`/flows/${id}/analytics`);
    return response.data;
  }

  /**
   * Get flow execution history
   */
  async getFlowExecutions(id: string, options?: QueryOptions): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/flows/${id}/executions`,
      {
        params: options,
      }
    );
    return response.data;
  }

  /**
   * Duplicate a flow
   */
  async duplicateFlow(id: string, name: string): Promise<Flow> {
    const response = await apiClient.post<Flow>(`/flows/${id}/duplicate`, { name });
    return response.data;
  }
}

export const flowsService = new FlowsService();
