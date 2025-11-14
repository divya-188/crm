/**
 * Message utility functions
 * Formatting and helper functions for message display
 */

/**
 * Format message time (e.g., "10:30 AM")
 */
export function formatMessageTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format message date for grouping (e.g., "Today", "Yesterday", "Jan 15, 2024")
 */
export function formatMessageDate(date: string | Date): string {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to midnight for comparison
  const messageDateMidnight = new Date(messageDate);
  messageDateMidnight.setHours(0, 0, 0, 0);

  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);

  const yesterdayMidnight = new Date(yesterday);
  yesterdayMidnight.setHours(0, 0, 0, 0);

  if (messageDateMidnight.getTime() === todayMidnight.getTime()) {
    return 'Today';
  } else if (messageDateMidnight.getTime() === yesterdayMidnight.getTime()) {
    return 'Yesterday';
  } else if (messageDate.getFullYear() === today.getFullYear()) {
    // Same year, show month and day
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } else {
    // Different year, show full date
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Format message timestamp with relative time
 */
export function formatMessageTimestamp(date: string | Date): string {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // More than a week, show date
  return formatMessageDate(date);
}

/**
 * Get message preview text (for conversation list)
 */
export function getMessagePreview(message: {
  type: string;
  content?: string;
  metadata?: any;
}): string {
  switch (message.type) {
    case 'text':
      return message.content || '';
    case 'image':
      return message.metadata?.caption || '📷 Image';
    case 'video':
      return message.metadata?.caption || '🎥 Video';
    case 'audio':
      return '🎵 Audio';
    case 'document':
      return `📄 ${message.metadata?.fileName || 'Document'}`;
    case 'location':
      return '📍 Location';
    case 'contact':
      return '👤 Contact';
    default:
      return 'Message';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
