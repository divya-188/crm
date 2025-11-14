import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/types/models.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useSocket } from '@/hooks/useSocket';
import { staggerContainer, staggerItem } from '@/lib/motion-variants';
import { formatMessageDate } from '@/lib/message-utils';

interface MessageListProps {
  messages: Message[];
  conversationId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, conversationId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useSocket();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Scroll to bottom on initial load
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: { conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('contact:typing', handleTyping);

    return () => {
      socket.off('contact:typing', handleTyping);
    };
  }, [socket, conversationId]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = formatMessageDate(message.sentAt);

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-neutral-600">No messages yet</p>
          <p className="text-sm text-neutral-500 mt-1">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-4"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-neutral-200">
                <span className="text-xs font-medium text-neutral-600">{group.date}</span>
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {group.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  variants={staggerItem}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <MessageBubble
                    message={message}
                    showAvatar={
                      index === 0 ||
                      group.messages[index - 1].direction !== message.direction
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};
