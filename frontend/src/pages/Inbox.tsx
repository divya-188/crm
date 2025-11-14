import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ConversationList, ConversationView } from '@/features/inbox';
import { useInboxStore } from '@/stores/inbox.store';
import { useConversations } from '@/hooks/useConversations';
import { useSocket } from '@/hooks/useSocket';
import { Conversation, Message } from '@/types/models.types';
import { MessageSquare } from 'lucide-react';

export const Inbox = () => {
  const {
    conversations,
    selectedConversation,
    filters,
    setConversations,
    selectConversation,
    updateFilters,
    addMessage,
    updateConversation,
    incrementUnreadCount,
  } = useInboxStore();

  const { socket } = useSocket();

  // Fetch conversations with filters
  const { data, isLoading } = useConversations(filters);

  // Update store when data changes
  useEffect(() => {
    if (data?.data) {
      setConversations(data.data);
    }
  }, [data, setConversations]);

  // Set up real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:new', (payload: { conversationId: string; message: Message }) => {
      addMessage(payload.conversationId, payload.message);

      // Increment unread count if not the selected conversation
      if (selectedConversation?.id !== payload.conversationId) {
        incrementUnreadCount(payload.conversationId);
      }
    });

    // Listen for message status updates
    socket.on('message:status', (_payload: { messageId: string; status: Message['status'] }) => {
      // Update message status in store if needed
      // This would require additional store methods
    });

    // Listen for conversation updates
    socket.on(
      'conversation:updated',
      (payload: { conversationId: string; updates: Partial<Conversation> }) => {
        updateConversation(payload.conversationId, payload.updates);
      }
    );

    // Listen for new conversations
    socket.on('conversation:new', (_payload: { conversation: Conversation }) => {
      // This would add the new conversation to the list
      // Requires additional store method
    });

    return () => {
      socket.off('message:new');
      socket.off('message:status');
      socket.off('conversation:updated');
      socket.off('conversation:new');
    };
  }, [socket, selectedConversation, addMessage, updateConversation, incrementUnreadCount]);

  const handleSelectConversation = (conversation: Conversation) => {
    selectConversation(conversation);
    // TODO: Mark as read when conversation is selected
  };

  const handleSearch = (query: string) => {
    updateFilters({ search: query });
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Conversation List Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="w-96 flex-shrink-0"
      >
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoading}
          onSearch={handleSearch}
          searchQuery={filters.search}
        />
      </motion.div>

      {/* Conversation View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ConversationView conversation={selectedConversation} />
        ) : (
          <EmptyConversationView />
        )}
      </div>
    </div>
  );
};

// Empty state when no conversation is selected
const EmptyConversationView = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex items-center justify-center bg-white"
    >
      <div className="text-center max-w-md px-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
          <MessageSquare className="w-12 h-12 text-primary-500" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Select a conversation</h3>
        <p className="text-neutral-600">
          Choose a conversation from the list to view messages and respond to customers.
        </p>
      </div>
    </motion.div>
  );
};
