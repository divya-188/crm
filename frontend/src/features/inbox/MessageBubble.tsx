import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '@/types/models.types';
import { Icons } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/message-utils';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showAvatar = true }) => {
  const isOutbound = message.direction === 'outbound';

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Image message"
                className="rounded-lg max-w-sm w-full h-auto"
                loading="lazy"
              />
            )}
            {message.metadata?.caption && (
              <div className="text-sm">{message.metadata.caption}</div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="rounded-lg max-w-sm w-full h-auto"
              >
                Your browser does not support the video tag.
              </video>
            )}
            {message.metadata?.caption && (
              <div className="text-sm">{message.metadata.caption}</div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Icons.mic className="w-5 h-5 flex-shrink-0" />
            {message.mediaUrl && (
              <audio src={message.mediaUrl} controls className="flex-1">
                Your browser does not support the audio tag.
              </audio>
            )}
            {message.metadata?.duration && (
              <span className="text-xs opacity-70">
                {Math.floor(message.metadata.duration / 60)}:
                {String(message.metadata.duration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        );

      case 'document':
        return (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-white/20">
              <Icons.file className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {message.metadata?.fileName || 'Document'}
              </div>
              {message.metadata?.fileSize && (
                <div className="text-xs opacity-70">
                  {formatFileSize(message.metadata.fileSize)}
                </div>
              )}
            </div>
            <Icons.download className="w-4 h-4 flex-shrink-0" />
          </a>
        );

      case 'location':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icons.globe className="w-5 h-5" />
              <span className="font-medium">Location</span>
            </div>
            {message.metadata?.latitude && message.metadata?.longitude && (
              <a
                href={`https://www.google.com/maps?q=${message.metadata.latitude},${message.metadata.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:opacity-80"
              >
                View on map
              </a>
            )}
          </div>
        );

      default:
        return <div className="text-sm opacity-70">Unsupported message type</div>;
    }
  };

  const renderStatusIndicator = () => {
    if (!isOutbound || !message.status) return null;

    const statusConfig: Record<string, { icon: any; color: string; title: string; double?: boolean }> = {
      sent: { icon: Icons.check, color: 'text-neutral-400', title: 'Sent' },
      delivered: { icon: Icons.check, color: 'text-neutral-500', title: 'Delivered', double: true },
      read: { icon: Icons.check, color: 'text-blue-500', title: 'Read', double: true },
      failed: { icon: Icons.alertCircle, color: 'text-red-500', title: 'Failed' },
    };

    const config = statusConfig[message.status];
    if (!config) return null;

    const StatusIcon = config.icon;

    return (
      <div className="flex items-center gap-0.5" title={config.title}>
        <StatusIcon className={cn('w-3.5 h-3.5', config.color)} />
        {config.double && <StatusIcon className={cn('w-3.5 h-3.5 -ml-2', config.color)} />}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex gap-2 items-end',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar for inbound messages */}
      {!isOutbound && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Icons.user className="w-4 h-4 text-primary-600" />
        </div>
      )}
      {!isOutbound && !showAvatar && <div className="w-8" />}

      {/* Message Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
          isOutbound
            ? 'bg-primary-600 text-white rounded-br-sm'
            : 'bg-white text-neutral-900 rounded-bl-sm'
        )}
      >
        {/* Message Content */}
        <div className="mb-1">{renderMessageContent()}</div>

        {/* Timestamp and Status */}
        <div
          className={cn(
            'flex items-center gap-1.5 justify-end text-xs',
            isOutbound ? 'text-white/70' : 'text-neutral-500'
          )}
        >
          <span>{formatMessageTime(message.sentAt)}</span>
          {renderStatusIndicator()}
        </div>
      </motion.div>

      {/* Spacer for outbound messages */}
      {isOutbound && <div className="w-8" />}
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
