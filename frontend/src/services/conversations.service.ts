import apiClient from '@/lib/api-client';
import {
  Conversation,
  ConversationFilters,
  Message,
  SendMessageDto,
} from '@/types/models.types';
import { PaginatedResponse, QueryOptions } from '@/types/api.types';

class ConversationsService {
  /**
   * Get all conversations with filters
   */
  async getConversations(
    filters?: ConversationFilters & QueryOptions
  ): Promise<PaginatedResponse<Conversation>> {
    const response = await apiClient.get<PaginatedResponse<Conversation>>('/conversations', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data;
  }

  /**
   * Update conversation (status, assignment, etc.)
   */
  async updateConversation(
    id: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const response = await apiClient.patch<Conversation>(`/conversations/${id}`, updates);
    return response.data;
  }

  /**
   * Assign conversation to an agent
   */
  async assignConversation(id: string, agentId: string): Promise<Conversation> {
    const response = await apiClient.patch<Conversation>(`/conversations/${id}/assign`, {
      agentId,
    });
    return response.data;
  }

  /**
   * Add tags to a conversation
   */
  async addTags(id: string, tags: string[]): Promise<Conversation> {
    const response = await apiClient.post<Conversation>(`/conversations/${id}/tags`, {
      tags,
    });
    return response.data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: QueryOptions
  ): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      {
        params: options,
      }
    );
    return response.data;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(data: SendMessageDto): Promise<Message> {
    const response = await apiClient.post<Message>(
      `/conversations/${data.conversationId}/messages`,
      data
    );
    return response.data;
  }

  /**
   * Add an internal note to a conversation
   */
  async addNote(conversationId: string, note: string): Promise<void> {
    await apiClient.post(`/conversations/${conversationId}/notes`, { note });
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/conversations/${conversationId}/read`);
  }
}

export const conversationsService = new ConversationsService();
