import apiClient from '@/lib/api-client';
import { PaginatedResponse, QueryOptions } from '@/types/api.types';

export interface AutomationTrigger {
  type: 'message_received' | 'conversation_created' | 'conversation_assigned' | 'tag_added' | 'contact_created' | 'contact_updated' | 'scheduled';
  config?: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface AutomationAction {
  type: 'send_message' | 'assign_conversation' | 'add_tag' | 'remove_tag' | 'update_contact' | 'trigger_flow' | 'send_email' | 'webhook';
  config: Record<string, any>;
}

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: Record<string, any>;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  status: 'active' | 'inactive' | 'draft';
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationDto {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: Record<string, any>;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  status?: 'active' | 'inactive' | 'draft';
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  status: 'success' | 'failed';
  triggeredBy: string;
  executedAt: string;
  duration: number;
  error?: string;
  context: Record<string, any>;
}

class AutomationsService {
  /**
   * Get all automations
   */
  async getAutomations(options?: QueryOptions & { status?: string }): Promise<PaginatedResponse<Automation>> {
    const response = await apiClient.get<PaginatedResponse<Automation>>('/automations', {
      params: options,
    });
    return response.data;
  }

  /**
   * Get a single automation by ID
   */
  async getAutomation(id: string): Promise<Automation> {
    const response = await apiClient.get<Automation>(`/automations/${id}`);
    return response.data;
  }

  /**
   * Create a new automation
   */
  async createAutomation(data: CreateAutomationDto): Promise<Automation> {
    const response = await apiClient.post<Automation>('/automations', data);
    return response.data;
  }

  /**
   * Update an automation
   */
  async updateAutomation(id: string, data: Partial<CreateAutomationDto>): Promise<Automation> {
    const response = await apiClient.put<Automation>(`/automations/${id}`, data);
    return response.data;
  }

  /**
   * Delete an automation
   */
  async deleteAutomation(id: string): Promise<void> {
    await apiClient.delete(`/automations/${id}`);
  }

  /**
   * Activate an automation
   */
  async activateAutomation(id: string): Promise<Automation> {
    const response = await apiClient.post<Automation>(`/automations/${id}/activate`);
    return response.data;
  }

  /**
   * Deactivate an automation
   */
  async deactivateAutomation(id: string): Promise<Automation> {
    const response = await apiClient.post<Automation>(`/automations/${id}/deactivate`);
    return response.data;
  }

  /**
   * Get automation execution history
   */
  async getExecutions(id: string, options?: QueryOptions): Promise<PaginatedResponse<AutomationExecution>> {
    const response = await apiClient.get<PaginatedResponse<AutomationExecution>>(
      `/automations/${id}/executions`,
      {
        params: options,
      }
    );
    return response.data;
  }

  /**
   * Test an automation with sample data
   */
  async testAutomation(id: string, testData?: any): Promise<{
    success: boolean;
    executedActions: string[];
    logs: Array<{
      timestamp: string;
      action: string;
      result: string;
    }>;
    error?: string;
  }> {
    const response = await apiClient.post(`/automations/${id}/test`, { testData });
    return response.data;
  }

  /**
   * Duplicate an automation
   */
  async duplicateAutomation(id: string): Promise<Automation> {
    const response = await apiClient.post<Automation>(`/automations/${id}/duplicate`);
    return response.data;
  }
}

export const automationsService = new AutomationsService();
