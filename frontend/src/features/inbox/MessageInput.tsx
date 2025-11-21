import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  Loader2,
  Zap,
  FileText,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSendMessage } from '@/hooks/useConversations';
import { useSocket } from '@/hooks/useSocket';
import { useWindowStatus } from '@/hooks/useWindowStatus';
import { useAuth } from '@/hooks/useAuth';
import { MessageType } from '@/types/models.types';
import Toast from '@/lib/toast-system';
import { mediaService } from '@/services';
import { EmojiPicker } from './EmojiPicker';
import { MediaUpload } from './MediaUpload';
import { SavedResponsesDropdown } from './SavedResponsesDropdown';
import { FilePreview } from './FilePreview';
import { TemplateMessageComposer } from '@/components/templates/messaging';

interface MessageInputProps {
  conversationId: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: MessageType;
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showSavedResponses, setShowSavedResponses] = useState(false);
  const [showTemplateComposer, setShowTemplateComposer] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { socket } = useSocket();
  const { data: windowStatus } = useWindowStatus(conversationId);
  const { hasRole } = useAuth();

  const isWindowClosed = windowStatus && !windowStatus.isOpen;
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (socket && message.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit('conversation:typing', { conversationId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isTyping) {
        setIsTyping(false);
        socket.emit('conversation:typing', { conversationId, isTyping: false });
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, socket, conversationId, isTyping]);

  const handleSend = async () => {
    if ((!message.trim() && !uploadedFile) || isSending) return;

    // Prepare message data
    const messageData: any = {
      type: uploadedFile ? uploadedFile.type : 'text',
      direction: 'outbound',
      content: message.trim() || undefined,
    };

    // If there's a file, upload it first
    if (uploadedFile) {
      setIsUploading(true);
      try {
        const mediaUrl = await uploadMedia(uploadedFile.file);
        messageData.mediaUrl = mediaUrl;
        messageData.metadata = {
          fileName: uploadedFile.file.name,
          fileSize: uploadedFile.file.size,
          mimeType: uploadedFile.file.type,
        };
      } catch (error) {
        Toast.error('Failed to upload file');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Send message with optimistic update
    sendMessage({ ...messageData, conversationId }, {
      onSuccess: () => {
        setMessage('');
        setUploadedFile(null);
        if (socket && isTyping) {
          socket.emit('conversation:typing', { conversationId, isTyping: false });
          setIsTyping(false);
        }
        textareaRef.current?.focus();
      },
      onError: (error: any) => {
        Toast.error(error.response?.data?.error?.message || 'Failed to send message');
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);

    setMessage(newMessage);
    setShowEmojiPicker(false);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileSelect = (file: File, type: MessageType) => {
    const preview = URL.createObjectURL(file);
    setUploadedFile({ file, preview, type });
    setShowMediaUpload(false);
  };

  const handleRemoveFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview);
      setUploadedFile(null);
    }
  };

  const handleSavedResponseSelect = (response: string) => {
    setMessage(response);
    setShowSavedResponses(false);
    textareaRef.current?.focus();
  };

  const uploadMedia = async (file: File): Promise<string> => {
    try {
      const result = await mediaService.uploadFile(file);
      return result.url;
    } catch (error) {
      console.error('Media upload error:', error);
      throw new Error('Failed to upload media file');
    }
  };

  const handleTemplateSend = async (templateId: string, variableValues: Record<string, string>) => {
    const messageData: any = {
      type: 'template',
      direction: 'outbound',
      templateId,
      variableValues,
    };

    return new Promise<void>((resolve, reject) => {
      sendMessage({ ...messageData, conversationId }, {
        onSuccess: () => {
          Toast.success('Template message sent successfully');
          resolve();
        },
        onError: (error: any) => {
          Toast.error(error.response?.data?.error?.message || 'Failed to send template message');
          reject(error);
        },
      });
    });
  };

  const canSend = (message.trim() || uploadedFile) && !isSending && !isUploading && !isWindowClosed;

  return (
    <div className="border-t border-neutral-200 bg-white">
      {/* Window Closed - Role-Based Message */}
      {isWindowClosed && (
        <div className="px-4 pt-4 pb-2">
          {isAdmin ? (
            // Admin: Can send templates
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock className="text-amber-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Free-form messaging disabled
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Use template messages only until customer replies
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTemplateComposer(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Send Template
              </motion.button>
            </div>
          ) : (
            // Agent: Cannot send anything
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ShieldAlert className="text-red-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  ⛔ Messaging Window Expired
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  You cannot send messages. Only admins can send template messages.
                </p>
                <p className="text-xs text-red-600 mt-1 font-medium">
                  💡 Contact your administrator or wait for the customer to reply.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Preview */}
      <AnimatePresence>
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-4"
          >
            <FilePreview
              file={uploadedFile.file}
              preview={uploadedFile.preview}
              type={uploadedFile.type}
              onRemove={handleRemoveFile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Action Buttons - Left */}
          <div className="flex items-center gap-1">
            {/* Media Upload */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: isWindowClosed ? 1 : 1.05 }}
                whileTap={{ scale: isWindowClosed ? 1 : 0.95 }}
                onClick={() => !isWindowClosed && setShowMediaUpload(!showMediaUpload)}
                disabled={isWindowClosed}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isWindowClosed
                    ? 'text-neutral-300 cursor-not-allowed'
                    : showMediaUpload
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-neutral-500 hover:bg-neutral-100'
                )}
                title={isWindowClosed ? 'Disabled - Window closed' : 'Attach media'}
              >
                <Paperclip size={20} />
              </motion.button>

              <AnimatePresence>
                {showMediaUpload && (
                  <MediaUpload
                    onFileSelect={handleFileSelect}
                    onClose={() => setShowMediaUpload(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Saved Responses */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: isWindowClosed ? 1 : 1.05 }}
                whileTap={{ scale: isWindowClosed ? 1 : 0.95 }}
                onClick={() => !isWindowClosed && setShowSavedResponses(!showSavedResponses)}
                disabled={isWindowClosed}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isWindowClosed
                    ? 'text-neutral-300 cursor-not-allowed'
                    : showSavedResponses
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-neutral-500 hover:bg-neutral-100'
                )}
                title={isWindowClosed ? 'Disabled - Window closed' : 'Saved responses'}
              >
                <Zap size={20} />
              </motion.button>

              <AnimatePresence>
                {showSavedResponses && !isWindowClosed && (
                  <SavedResponsesDropdown
                    onSelect={handleSavedResponseSelect}
                    onClose={() => setShowSavedResponses(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Template Messages */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTemplateComposer(true)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isWindowClosed
                  ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-200'
                  : 'text-neutral-500 hover:bg-neutral-100'
              )}
              title="Send template message"
            >
              <FileText size={20} />
            </motion.button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isWindowClosed ? 'Free-form messages disabled - Use templates' : 'Type a message...'}
              className={cn(
                'w-full px-4 py-2.5 pr-12 rounded-lg border',
                isWindowClosed
                  ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                  : 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'resize-none transition-all',
                'min-h-[44px] max-h-[150px]'
              )}
              rows={1}
              disabled={isSending || isUploading || isWindowClosed}
            />

            {/* Emoji Picker Button */}
            {!isWindowClosed && (
              <div className="absolute right-2 bottom-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    showEmojiPicker
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-500 hover:bg-neutral-100'
                  )}
                  title="Add emoji"
                >
                  <Smile size={18} />
                </motion.button>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: canSend ? 1.05 : 1 }}
            whileTap={{ scale: canSend ? 0.95 : 1 }}
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'p-3 rounded-lg transition-all',
              canSend
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
            title={isWindowClosed ? 'Window closed - Use templates' : 'Send message'}
          >
            {isSending || isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isWindowClosed ? (
              <Lock size={20} />
            ) : (
              <Send size={20} />
            )}
          </motion.button>
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-xs text-neutral-500">
          {isWindowClosed 
            ? isAdmin
              ? '🔒 Free-form messages disabled. Click the template button to send approved messages.'
              : '⛔ You cannot send messages. Contact admin or wait for customer reply.'
            : 'Press Enter to send, Shift+Enter for new line'
          }
        </div>
      </div>

      {/* Template Message Composer Modal */}
      <AnimatePresence>
        {showTemplateComposer && (
          <TemplateMessageComposer
            isOpen={showTemplateComposer}
            onClose={() => setShowTemplateComposer(false)}
            onSend={handleTemplateSend}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
