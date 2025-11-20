import apiClient from '@/lib/api-client';
import { Template, CreateTemplateDto } from '@/types/models.types';
import { PaginatedResponse, QueryOptions } from '@/types/api.types';

class TemplatesService {
  /**
   * Get all templates
   */
  async getTemplates(options?: QueryOptions): Promise<PaginatedResponse<Template>> {
    const response = await apiClient.get<PaginatedResponse<Template>>('/templates', {
      params: options,
    });
    return response.data;
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    const response = await apiClient.get<Template>(`/templates/${id}`);
    return response.data;
  }

  /**
   * Create a new template
   */
  async createTemplate(data: CreateTemplateDto): Promise<Template> {
    const response = await apiClient.post<Template>('/templates', data);
    return response.data;
  }

  /**
   * Update a template
   */
  async updateTemplate(id: string, data: Partial<CreateTemplateDto>): Promise<Template> {
    const response = await apiClient.patch<Template>(`/templates/${id}`, data);
    return response.data;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/templates/${id}`);
  }

  /**
   * Submit template to Meta for approval
   */
  async submitTemplate(id: string): Promise<Template> {
    const response = await apiClient.post<Template>(`/templates/${id}/submit`);
    return response.data;
  }

  /**
   * Get template preview
   */
  async getTemplatePreview(id: string): Promise<{ preview: string }> {
    const response = await apiClient.get<{ preview: string }>(`/templates/${id}/preview`);
    return response.data;
  }

  /**
   * Duplicate a template
   * @param id - Template ID to duplicate
   * @param newName - Optional custom name for the duplicate (if not provided, auto-generates with _copy suffix)
   */
  async duplicateTemplate(id: string, newName?: string): Promise<Template> {
    const response = await apiClient.post<Template>(`/templates/${id}/duplicate`, {
      newName,
    });
    return response.data;
  }

  /**
   * Get template categories with descriptions
   */
  async getCategories(): Promise<{
    categories: Array<{
      code: string;
      name: string;
      description: string;
      examples: string[];
      approvalDifficulty: string;
      restrictions: string[];
    }>;
    cached: boolean;
    cacheExpiresIn: number | null;
  }> {
    const response = await apiClient.get('/templates/categories');
    return response.data;
  }

  /**
   * Get supported template languages
   */
  async getLanguages(): Promise<{
    languages: Array<{
      code: string;
      name: string;
      nativeName: string;
      direction: 'ltr' | 'rtl';
      popular: boolean;
    }>;
    cached: boolean;
    cacheExpiresIn: number | null;
  }> {
    const response = await apiClient.get('/templates/languages');
    return response.data;
  }

  /**
   * Upload media for template header
   */
  async uploadMedia(formData: FormData): Promise<{
    mediaHandle: string;
    url: string;
  }> {
    const response = await apiClient.post<{
      mediaHandle: string;
      url: string;
    }>('/templates/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Send test template to a phone number
   */
  async sendTestTemplate(
    id: string,
    data: {
      phoneNumber: string;
      placeholderValues: Record<string, string>;
    }
  ): Promise<{
    success: boolean;
    messageId: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      messageId: string;
    }>(`/templates/${id}/test`, data);
    return response.data;
  }

  /**
   * Get test send history for a template
   */
  async getTestHistory(id: string): Promise<Array<{
    id: string;
    phoneNumber: string;
    placeholderValues: Record<string, string>;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    errorMessage?: string;
    metaMessageId?: string;
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
  }>> {
    const response = await apiClient.get(`/templates/${id}/test-history`);
    return response.data;
  }

  /**
   * Add a test phone number (max 5 per WABA)
   */
  async addTestPhoneNumber(data: {
    wabaId: string;
    phoneNumber: string;
    label?: string;
  }): Promise<{
    id: string;
    phoneNumber: string;
    label?: string;
    wabaId: string;
    isActive: boolean;
    usageCount: number;
    lastUsedAt?: string;
    createdAt: string;
  }> {
    const response = await apiClient.post('/templates/test-phone-numbers', data);
    return response.data;
  }

  /**
   * Get all test phone numbers for a tenant
   */
  async getTestPhoneNumbers(wabaId?: string): Promise<Array<{
    id: string;
    phoneNumber: string;
    label?: string;
    wabaId: string;
    isActive: boolean;
    usageCount: number;
    lastUsedAt?: string;
    createdAt: string;
  }>> {
    const response = await apiClient.get('/templates/test-phone-numbers', {
      params: wabaId ? { wabaId } : undefined,
    });
    return response.data;
  }

  /**
   * Update a test phone number
   */
  async updateTestPhoneNumber(
    testNumberId: string,
    data: {
      label?: string;
      isActive?: boolean;
    }
  ): Promise<{
    id: string;
    phoneNumber: string;
    label?: string;
    wabaId: string;
    isActive: boolean;
    usageCount: number;
    lastUsedAt?: string;
    createdAt: string;
  }> {
    const response = await apiClient.patch(
      `/templates/test-phone-numbers/${testNumberId}`,
      data
    );
    return response.data;
  }

  /**
   * Remove a test phone number
   */
  async removeTestPhoneNumber(testNumberId: string): Promise<void> {
    await apiClient.delete(`/templates/test-phone-numbers/${testNumberId}`);
  }

  /**
   * Get analytics for a specific template
   */
  async getTemplateAnalytics(
    templateId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    templateId: string;
    templateName: string;
    category: string;
    language: string;
    status: string;
    dateRange: {
      start: string;
      end: string;
    };
    metrics: {
      totalSent: number;
      totalDelivered: number;
      totalRead: number;
      totalReplied: number;
      totalFailed: number;
      avgDeliveryRate: number;
      avgReadRate: number;
      avgResponseRate: number;
    };
    dailyMetrics: Array<{
      date: string;
      sendCount: number;
      deliveredCount: number;
      readCount: number;
      repliedCount: number;
      failedCount: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    }>;
    trends: {
      deliveryRateTrend: 'up' | 'down' | 'stable';
      readRateTrend: 'up' | 'down' | 'stable';
      responseRateTrend: 'up' | 'down' | 'stable';
      usageTrend: 'up' | 'down' | 'stable';
    };
  }> {
    const response = await apiClient.get(`/templates/${templateId}/analytics`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get analytics summary across all templates
   */
  async getAnalyticsSummary(options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    language?: string;
    status?: string;
  }): Promise<{
    dateRange: {
      start: string;
      end: string;
    };
    overallMetrics: {
      totalTemplates: number;
      activeTemplates: number;
      totalSent: number;
      avgDeliveryRate: number;
      avgReadRate: number;
      avgResponseRate: number;
    };
    topTemplates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      totalSent: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    }>;
    lowPerformingTemplates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      totalSent: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
      issues: string[];
    }>;
    categoryBreakdown: Array<{
      category: string;
      templateCount: number;
      totalSent: number;
      avgDeliveryRate: number;
      avgReadRate: number;
      avgResponseRate: number;
    }>;
  }> {
    const response = await apiClient.get('/templates/analytics/summary', {
      params: options,
    });
    return response.data;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    templateIds?: string[];
    category?: string;
    language?: string;
    format?: 'json' | 'csv';
  }): Promise<string> {
    const params: any = { ...options };
    if (options?.templateIds) {
      params.templateIds = options.templateIds.join(',');
    }
    
    const response = await apiClient.get('/templates/analytics/export', {
      params,
      responseType: options?.format === 'csv' ? 'text' : 'json',
    });
    return response.data;
  }

  /**
   * Get all versions of a template
   * Returns all versions ordered by version number (newest first)
   */
  async getTemplateVersions(templateId: string): Promise<Template[]> {
    const response = await apiClient.get<Template[]>(`/templates/${templateId}/versions`);
    return response.data;
  }

  /**
   * Preview template import without actually importing
   */
  async previewImport(data: {
    file?: File;
    templates?: any[];
    skipDuplicates?: boolean;
    namePrefix?: string;
  }): Promise<{
    totalTemplates: number;
    validTemplates: number;
    invalidTemplates: number;
    duplicates: number;
    templates: Array<{
      name: string;
      displayName?: string;
      category: string;
      language: string;
      status: 'valid' | 'invalid' | 'duplicate';
      errors?: string[];
      warnings?: string[];
    }>;
  }> {
    const formData = new FormData();
    
    if (data.file) {
      formData.append('file', data.file);
    } else if (data.templates) {
      formData.append('templates', JSON.stringify(data.templates));
    }
    
    if (data.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', String(data.skipDuplicates));
    }
    
    if (data.namePrefix) {
      formData.append('namePrefix', data.namePrefix);
    }

    const response = await apiClient.post('/templates/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Import templates from JSON file or data
   */
  async importTemplates(data: {
    file?: File;
    templates?: any[];
    skipDuplicates?: boolean;
    createVersions?: boolean;
    namePrefix?: string;
  }): Promise<{
    imported: number;
    skipped: number;
    failed: number;
    errors: Array<{
      templateName: string;
      error: string;
      details?: any;
    }>;
    templates: Template[];
  }> {
    const formData = new FormData();
    
    if (data.file) {
      formData.append('file', data.file);
    } else if (data.templates) {
      formData.append('templates', JSON.stringify(data.templates));
    }
    
    if (data.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', String(data.skipDuplicates));
    }
    
    if (data.createVersions !== undefined) {
      formData.append('createVersions', String(data.createVersions));
    }
    
    if (data.namePrefix) {
      formData.append('namePrefix', data.namePrefix);
    }

    const response = await apiClient.post('/templates/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Export templates to JSON format
   */
  async exportTemplates(options?: {
    templateIds?: string[];
    includeArchived?: boolean;
    includeAnalytics?: boolean;
    includeHistory?: boolean;
  }): Promise<{
    templates: any[];
    metadata: {
      exportedAt: string;
      totalTemplates: number;
      tenantId: string;
      includeAnalytics: boolean;
      includeHistory: boolean;
    };
  }> {
    const params: any = {};
    
    if (options?.templateIds && options.templateIds.length > 0) {
      params.templateIds = options.templateIds.join(',');
    }
    
    if (options?.includeArchived !== undefined) {
      params.includeArchived = options.includeArchived;
    }
    
    if (options?.includeAnalytics !== undefined) {
      params.includeAnalytics = options.includeAnalytics;
    }
    
    if (options?.includeHistory !== undefined) {
      params.includeHistory = options.includeHistory;
    }

    const response = await apiClient.get('/templates/export', { params });
    return response.data;
  }

  /**
   * Get all campaigns using a specific template
   * Requirement 19.6: Track which templates are used in which campaigns
   */
  async getCampaignsUsingTemplate(
    templateId: string,
    activeOnly: boolean = false
  ): Promise<Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
  }>> {
    const response = await apiClient.get(`/templates/${templateId}/campaigns`, {
      params: { activeOnly },
    });
    return response.data;
  }

  /**
   * Get comprehensive usage statistics for a template including campaign usage
   * Requirement 19.6: Track which templates are used in which campaigns
   */
  async getTemplateUsageStats(templateId: string): Promise<{
    templateId: string;
    templateName: string;
    usageCount: number;
    lastUsedAt: string | null;
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    campaigns: Array<{
      id: string;
      name: string;
      status: string;
      createdAt: string;
      startedAt: string | null;
      completedAt: string | null;
      totalRecipients: number;
      sentCount: number;
    }>;
  }> {
    const response = await apiClient.get(`/templates/${templateId}/usage-stats`);
    return response.data;
  }

  /**
   * Check if a template can be deleted
   * Requirement 19.7: Prevent deletion of templates in active campaigns
   */
  async canDeleteTemplate(templateId: string): Promise<{
    canDelete: boolean;
    reason?: string;
    activeCampaigns?: Array<{
      id: string;
      name: string;
      status: string;
    }>;
  }> {
    const response = await apiClient.get(`/templates/${templateId}/can-delete`);
    return response.data;
  }

  /**
   * Sync all templates from Meta
   * Fetches current status from Meta and updates local database
   */
  async syncTemplatesFromMeta(): Promise<{ synced: number; errors: string[] }> {
    const response = await apiClient.post<{ synced: number; errors: string[] }>('/templates/meta/sync');
    return response.data;
  }

  /**
   * Get template status from Meta
   * Checks the current status of a specific template in Meta
   */
  async getMetaStatus(id: string): Promise<{
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
  }> {
    const response = await apiClient.get(`/templates/${id}/meta-status`);
    return response.data;
  }

  /**
   * Fetch all templates from Meta
   * Gets all templates from Meta API
   */
  async fetchAllFromMeta(): Promise<any[]> {
    const response = await apiClient.get('/templates/meta/fetch-all');
    return response.data;
  }
}

export const templatesService = new TemplatesService();
