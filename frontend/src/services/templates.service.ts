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
}

export const templatesService = new TemplatesService();
