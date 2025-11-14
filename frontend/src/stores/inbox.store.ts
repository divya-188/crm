import { create } from 'zustand';
import { Conversation, ConversationFilters, Message } from '@/types/models.types';

interface InboxState {
  // State
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  filters: ConversationFilters;
  isLoading: boolean;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  selectConversation: (conversation: Conversation | null) => void;
  setFilters: (filters: ConversationFilters) => void;
  updateFilters: (filters: Partial<ConversationFilters>) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const initialFilters: ConversationFilters = {
  status: 'all',
  assignedTo: 'all',
  tags: [],
  search: '',
};

export const useInboxStore = create<InboxState>((set) => ({
  // Initial state
  conversations: [],
  selectedConversation: null,
  filters: initialFilters,
  isLoading: false,

  // Actions
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      selectedConversation:
        state.selectedConversation?.id === id
          ? { ...state.selectedConversation, ...updates }
          : state.selectedConversation,
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      selectedConversation:
        state.selectedConversation?.id === id ? null : state.selectedConversation,
    })),

  selectConversation: (conversation) =>
    set({ selectedConversation: conversation }),

  setFilters: (filters) => set({ filters }),

  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: message,
              lastMessageAt: message.sentAt,
            }
          : conv
      ),
    })),

  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.lastMessage?.id === messageId
          ? {
              ...conv,
              lastMessage: { ...conv.lastMessage, status },
            }
          : conv
      ),
    })),

  incrementUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, unreadCount: conv.unreadCount + 1 }
          : conv
      ),
    })),

  resetUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      conversations: [],
      selectedConversation: null,
      filters: initialFilters,
      isLoading: false,
    }),
}));
