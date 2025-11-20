import apiClient from '../lib/api-client';

export interface TeamSettings {
  defaultSettings?: {
    defaultUserRole?: 'agent' | 'user';
    autoAssignConversations?: boolean;
    assignmentStrategy?: 'round_robin' | 'load_balanced' | 'manual';
  };
  invitationSettings?: {
    allowSelfRegistration?: boolean;
    approvedEmailDomains?: string[];
    requireAdminApproval?: boolean;
  };
  departments?: Array<{
    id: string;
    name: string;
    description?: string;
    memberIds?: string[];
  }>;
}

export interface CreateDepartment {
  name: string;
  description?: string;
}

export interface UpdateDepartment {
  name?: string;
  description?: string;
  memberIds?: string[];
}

const teamSettingsService = {
  async getSettings(): Promise<TeamSettings> {
    const response = await apiClient.get('/tenants/settings/team');
    return response.data;
  },

  async updateSettings(settings: Partial<TeamSettings>): Promise<TeamSettings> {
    const response = await apiClient.put('/tenants/settings/team', settings);
    return response.data;
  },

  async getDefaultRole(): Promise<{ role: 'agent' | 'user' }> {
    const response = await apiClient.get('/tenants/settings/team/default-role');
    return response.data;
  },

  async getAssignmentStrategy(): Promise<{
    strategy: 'round_robin' | 'load_balanced' | 'manual';
  }> {
    const response = await apiClient.get('/tenants/settings/team/assignment-strategy');
    return response.data;
  },

  async createDepartment(department: CreateDepartment): Promise<TeamSettings> {
    const response = await apiClient.post('/tenants/settings/team/departments', department);
    return response.data;
  },

  async updateDepartment(
    id: string,
    updates: UpdateDepartment,
  ): Promise<TeamSettings> {
    const response = await apiClient.put(`/tenants/settings/team/departments/${id}`, updates);
    return response.data;
  },

  async deleteDepartment(id: string): Promise<TeamSettings> {
    const response = await apiClient.delete(`/tenants/settings/team/departments/${id}`);
    return response.data;
  },
};

export default teamSettingsService;
