import React from 'react';
import { motion } from 'framer-motion';
import { Conversation } from '@/types/models.types';
import { Icons } from '@/lib/icons';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { ConversationActions } from './ConversationActions';

interface ConversationHeaderProps {
  conversation: Conversation;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({ conversation }) => {
  const contact = conversation.contact;
  const assignedAgent = conversation.assignedAgent;

  const getStatusColor = (status: Conversation['status']) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'pending':
        return 'warning';
      case 'resolved':
        return 'info';
      case 'closed':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white"
    >
      {/* Contact Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {contact?.avatar || contact?.avatarUrl ? (
            <img
              src={contact.avatar || contact.avatarUrl}
              alt={contact.firstName || contact.phone || 'Contact'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Icons.user className="w-6 h-6 text-primary-600" />
            </div>
          )}
          {/* Online status indicator - placeholder */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-neutral-300 rounded-full border-2 border-white" />
        </div>

        {/* Contact Details */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {contact?.firstName || contact?.phone || 'Unknown Contact'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Icons.phone className="w-3.5 h-3.5" />
            <span>{contact?.phone || 'No phone number'}</span>
          </div>
        </div>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Status Badge */}
        <Badge variant={getStatusColor(conversation.status)} size="sm">
          {conversation.status}
        </Badge>

        {/* Assigned Agent */}
        {assignedAgent && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Icons.user className="w-4 h-4" />
            <span>
              {assignedAgent.firstName} {assignedAgent.lastName}
            </span>
          </div>
        )}

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {conversation.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="neutral" size="sm">
                {tag}
              </Badge>
            ))}
            {conversation.tags.length > 2 && (
              <Badge variant="neutral" size="sm">
                +{conversation.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            className={cn(
              'p-2 rounded-lg hover:bg-neutral-100 transition-colors',
              'text-neutral-600 hover:text-neutral-900'
            )}
            title="Search in conversation"
          >
            <Icons.search className="w-5 h-5" />
          </button>

          <ConversationActions conversation={conversation} />
        </div>
      </div>
    </motion.div>
  );
};
