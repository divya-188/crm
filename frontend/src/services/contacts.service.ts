import apiClient from '@/lib/api-client';
import {
  Contact,
  CreateContactDto,
  UpdateContactDto,
  CustomFieldDefinition,
  CreateCustomFieldDefinitionDto,
  UpdateCustomFieldDefinitionDto,
} from '@/types/models.types';
import { PaginatedResponse, QueryOptions } from '@/types/api.types';

class ContactsService {
  /**
   * Get all contacts with pagination and filters
   */
  async getContacts(options?: QueryOptions): Promise<PaginatedResponse<Contact>> {
    const response = await apiClient.get<PaginatedResponse<Contact>>('/contacts', {
      params: options,
    });
    return response.data;
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<Contact> {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return response.data;
  }

  /**
   * Create a new contact
   */
  async createContact(data: CreateContactDto): Promise<Contact> {
    const response = await apiClient.post<Contact>('/contacts', data);
    return response.data;
  }

  /**
   * Update a contact
   */
  async updateContact(id: string, data: UpdateContactDto): Promise<Contact> {
    const response = await apiClient.patch<Contact>(`/contacts/${id}`, data);
    return response.data;
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/contacts/${id}`);
  }

  /**
   * Add tags to a contact
   */
  async addTags(id: string, tags: string[]): Promise<Contact> {
    const response = await apiClient.post<Contact>(`/contacts/${id}/tags`, { tags });
    return response.data;
  }

  /**
   * Remove a tag from a contact
   */
  async removeTag(id: string, tag: string): Promise<Contact> {
    const response = await apiClient.delete<Contact>(`/contacts/${id}/tags/${tag}`);
    return response.data;
  }

  /**
   * Import contacts from CSV
   */
  async importContacts(file: File): Promise<{ imported: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ imported: number; failed: number }>(
      '/contacts/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Export contacts to CSV
   */
  async exportContacts(filters?: QueryOptions): Promise<Blob> {
    const response = await apiClient.get('/contacts/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Create a new segment
   */
  async createSegment(data: any): Promise<any> {
    const response = await apiClient.post('/contacts/segments', data);
    return response.data;
  }

  /**
   * Get all segments
   */
  async getSegments(): Promise<any[]> {
    const response = await apiClient.get('/contacts/segments');
    return response.data;
  }

  /**
   * Get a single segment
   */
  async getSegment(id: string): Promise<any> {
    const response = await apiClient.get(`/contacts/segments/${id}`);
    return response.data;
  }

  /**
   * Update a segment
   */
  async updateSegment(id: string, data: any): Promise<any> {
    const response = await apiClient.patch(`/contacts/segments/${id}`, data);
    return response.data;
  }

  /**
   * Delete a segment
   */
  async deleteSegment(id: string): Promise<void> {
    await apiClient.delete(`/contacts/segments/${id}`);
  }

  /**
   * Preview segment with criteria
   */
  async previewSegment(criteria: any): Promise<{ count: number; contacts: Contact[] }> {
    const response = await apiClient.post('/contacts/segments/preview', criteria);
    return response.data;
  }

  /**
   * Get contacts in a segment
   */
  async getSegmentContacts(id: string, options?: QueryOptions): Promise<PaginatedResponse<Contact>> {
    const response = await apiClient.get(`/contacts/segments/${id}/contacts`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Create a new custom field definition
   */
  async createCustomFieldDefinition(data: CreateCustomFieldDefinitionDto): Promise<CustomFieldDefinition> {
    const response = await apiClient.post<CustomFieldDefinition>('/contacts/custom-fields', data);
    return response.data;
  }

  /**
   * Get all custom field definitions
   */
  async getCustomFieldDefinitions(includeInactive: boolean = false): Promise<CustomFieldDefinition[]> {
    const response = await apiClient.get<CustomFieldDefinition[]>('/contacts/custom-fields', {
      params: { includeInactive },
    });
    return response.data;
  }

  /**
   * Get a single custom field definition
   */
  async getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition> {
    const response = await apiClient.get<CustomFieldDefinition>(`/contacts/custom-fields/${id}`);
    return response.data;
  }

  /**
   * Update a custom field definition
   */
  async updateCustomFieldDefinition(
    id: string,
    data: UpdateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinition> {
    const response = await apiClient.patch<CustomFieldDefinition>(`/contacts/custom-fields/${id}`, data);
    return response.data;
  }

  /**
   * Delete a custom field definition
   */
  async deleteCustomFieldDefinition(id: string): Promise<void> {
    await apiClient.delete(`/contacts/custom-fields/${id}`);
  }

  /**
   * Reorder a custom field definition
   */
  async reorderCustomFieldDefinition(id: string, sortOrder: number): Promise<CustomFieldDefinition> {
    const response = await apiClient.patch<CustomFieldDefinition>(
      `/contacts/custom-fields/${id}/reorder`,
      { sortOrder }
    );
    return response.data;
  }
}

export const contactsService = new ContactsService();
