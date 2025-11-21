import { Conversation } from '@/types/models.types';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
}

export const ConversationItem = ({ conversation, isSelected }: ConversationItemProps) => {
  const { contact, lastMessage, unreadCount, status, assignedAgent, assignedTo, tags, lastMessageAt } = conversation;

  // Use assignedTo if assignedAgent is not available
  const agent = assignedAgent || assignedTo;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'pending':
        return 'warning';
      case 'resolved':
        return 'secondary';
      case 'closed':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getMessageStatusIcon = () => {
    if (!lastMessage || lastMessage.direction === 'inbound') return null;

    switch (lastMessage.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-neutral-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-neutral-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-success-500" />;
      case 'failed':
        return <Clock className="w-3 h-3 text-danger-500" />;
      default:
        return null;
    }
  };

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return '';
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';

    switch (lastMessage.type) {
      case 'text':
        return lastMessage.content || '';
      case 'image':
        return '📷 Image';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Audio';
      case 'document':
        return '📄 Document';
      case 'location':
        return '📍 Location';
      case 'contact':
        return '👤 Contact';
      default:
        return 'Message';
    }
  };

  return (
    <div className={cn('p-4 relative', isSelected && 'bg-primary-50')}>
      {/* Unread indicator */}
      {unreadCount > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {contact?.avatar || contact?.avatarUrl ? (
            <img
              src={contact.avatar || contact.avatarUrl}
              alt={contact.firstName || contact.phone || 'Contact'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">
                {contact?.firstName || contact?.phone || 'Unknown Contact'}
              </h3>
              {contact?.phone && (
                <p className="text-xs text-neutral-500 truncate">{contact.phone}</p>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              {lastMessageAt && (
                <span className="text-xs text-neutral-500">
                  {formatLastMessageTime(lastMessageAt)}
                </span>
              )}
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Last Message */}
          <div className="flex items-center gap-1 mb-2">
            {getMessageStatusIcon()}
            <p
              className={cn(
                'text-sm truncate flex-1',
                unreadCount > 0 ? 'font-medium text-neutral-900' : 'text-neutral-600'
              )}
            >
              {getLastMessagePreview()}
            </p>
          </div>

          {/* Footer - Status, Tags, Assigned Agent */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getStatusColor(status)} size="sm">
              {status}
            </Badge>

            {tags && Array.isArray(tags) && tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="neutral" size="sm">
                {tag}
              </Badge>
            ))}

            {tags && Array.isArray(tags) && tags.length > 2 && (
              <Badge variant="neutral" size="sm">
                +{tags.length - 2}
              </Badge>
            )}

            {agent && (
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">
                  {agent.firstName} {agent.lastName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
