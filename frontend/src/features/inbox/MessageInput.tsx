import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  Loader2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSendMessage } from '@/hooks/useConversations';
import { useSocket } from '@/hooks/useSocket';
import { MessageType } from '@/types/models.types';
import { toast } from 'react-hot-toast';
import { mediaService } from '@/services';
import { EmojiPicker } from './EmojiPicker';
import { MediaUpload } from './MediaUpload';
import { SavedResponsesDropdown } from './SavedResponsesDropdown';
import { FilePreview } from './FilePreview';

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
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { socket } = useSocket();

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
      conversationId,
      type: uploadedFile ? uploadedFile.type : 'text',
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
        toast.error('Failed to upload file');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Send message with optimistic update
    sendMessage(messageData, {
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
        toast.error(error.response?.data?.error?.message || 'Failed to send message');
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

  const canSend = (message.trim() || uploadedFile) && !isSending && !isUploading;

  return (
    <div className="border-t border-neutral-200 bg-white">
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMediaUpload(!showMediaUpload)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showMediaUpload
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-neutral-500 hover:bg-neutral-100'
                )}
                title="Attach media"
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSavedResponses(!showSavedResponses)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showSavedResponses
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-neutral-500 hover:bg-neutral-100'
                )}
                title="Saved responses"
              >
                <Zap size={20} />
              </motion.button>

              <AnimatePresence>
                {showSavedResponses && (
                  <SavedResponsesDropdown
                    onSelect={handleSavedResponseSelect}
                    onClose={() => setShowSavedResponses(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={cn(
                'w-full px-4 py-2.5 pr-12 rounded-lg border border-neutral-300',
                'bg-white text-neutral-900 placeholder:text-neutral-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'resize-none transition-all',
                'min-h-[44px] max-h-[150px]'
              )}
              rows={1}
              disabled={isSending || isUploading}
            />

            {/* Emoji Picker Button */}
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
            title="Send message"
          >
            {isSending || isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </motion.button>
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-xs text-neutral-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
