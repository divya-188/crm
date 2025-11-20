import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsService } from '@/services';
import { ConversationFilters, SendMessageDto } from '@/types/models.types';
import { QueryOptions } from '@/types/api.types';
import Toast from '@/lib/toast-system';

/**
 * Query keys for conversations
 */
export const conversationsKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsKeys.all, 'list'] as const,
  list: (filters?: ConversationFilters & QueryOptions) =>
    [...conversationsKeys.lists(), filters] as const,
  details: () => [...conversationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationsKeys.details(), id] as const,
  messages: (id: string) => [...conversationsKeys.detail(id), 'messages'] as const,
};

/**
 * Hook to fetch conversations list
 */
export const useConversations = (filters?: ConversationFilters & QueryOptions) => {
  return useQuery({
    queryKey: conversationsKeys.list(filters),
    queryFn: () => conversationsService.getConversations(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to fetch a single conversation
 */
export const useConversation = (id: string) => {
  return useQuery({
    queryKey: conversationsKeys.detail(id),
    queryFn: () => conversationsService.getConversation(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch messages for a conversation
 */
export const useMessages = (conversationId: string, options?: QueryOptions) => {
  return useQuery({
    queryKey: [...conversationsKeys.messages(conversationId), options],
    queryFn: () => conversationsService.getMessages(conversationId, options),
    enabled: !!conversationId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });
};

/**
 * Hook to send a message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageDto) => conversationsService.sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: conversationsKeys.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationsKeys.detail(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
    },
  });
};

/**
 * Hook to assign a conversation
 */
export const useAssignConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      conversationsService.assignConversation(id, agentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
      Toast.success('Conversation assigned successfully');
    },
  });
};

/**
 * Hook to update conversation
 */
export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      conversationsService.updateConversation(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
      Toast.success('Conversation updated successfully');
    },
  });
};

/**
 * Hook to add tags to a conversation
 */
export const useAddConversationTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      conversationsService.addTags(id, tags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
      Toast.success('Tags added successfully');
    },
  });
};

/**
 * Hook to mark conversation as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationsService.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
    },
  });
};
