import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ConversationHeader } from './ConversationHeader';
import { WindowStatusBanner } from './WindowStatusBanner';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Conversation } from '@/types/models.types';
import { useMessages } from '@/hooks/useConversations';
import { useSocket } from '@/hooks/useSocket';
import { Spinner } from '@/components/ui';
import { fadeIn } from '@/lib/motion-variants';

interface ConversationViewProps {
  conversation: Conversation;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversation }) => {
  const { data: messagesData, isLoading } = useMessages(conversation.id, {
    page: 1,
    limit: 100,
  });
  const { socket } = useSocket();
  const conversationRef = useRef<HTMLDivElement>(null);

  // Join conversation room for real-time updates
  useEffect(() => {
    if (socket && conversation.id) {
      socket.emit('conversation:join', { conversationId: conversation.id });

      return () => {
        socket.emit('conversation:leave', { conversationId: conversation.id });
      };
    }
  }, [socket, conversation.id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  const messages = messagesData?.data || [];

  return (
    <motion.div
      ref={conversationRef}
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col bg-white h-full"
    >
      {/* Header */}
      <ConversationHeader conversation={conversation} />

      {/* 24-Hour Window Status Banner */}
      <WindowStatusBanner conversationId={conversation.id} />

      {/* Messages */}
      <MessageList messages={messages} conversationId={conversation.id} />

      {/* Message Input */}
      <MessageInput conversationId={conversation.id} />
    </motion.div>
  );
};
