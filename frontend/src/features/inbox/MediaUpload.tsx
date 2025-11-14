import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Video, FileText, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageType } from '@/types/models.types';
import { toast } from 'react-hot-toast';

interface MediaUploadProps {
  onFileSelect: (file: File, type: MessageType) => void;
  onClose: () => void;
}

const MEDIA_TYPES = [
  {
    type: 'image' as MessageType,
    label: 'Image',
    icon: ImageIcon,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    type: 'video' as MessageType,
    label: 'Video',
    icon: Video,
    accept: 'video/*',
    maxSize: 16 * 1024 * 1024, // 16MB
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-50',
  },
  {
    type: 'audio' as MessageType,
    label: 'Audio',
    icon: Music,
    accept: 'audio/*',
    maxSize: 16 * 1024 * 1024, // 16MB
    color: 'text-accent-600',
    bgColor: 'bg-accent-50',
  },
  {
    type: 'document' as MessageType,
    label: 'Document',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
    maxSize: 100 * 1024 * 1024, // 100MB
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
];

export const MediaUpload: React.FC<MediaUploadProps> = ({ onFileSelect, onClose }) => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadRef.current && !uploadRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: MessageType,
    maxSize: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${formatFileSize(maxSize)}`);
      return;
    }

    onFileSelect(file, type);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      ref={uploadRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden z-50"
    >
      <div className="p-2">
        <div className="space-y-1">
          {MEDIA_TYPES.map((mediaType) => {
            const Icon = mediaType.icon;
            return (
              <div key={mediaType.type}>
                <input
                  ref={(el) => (fileInputRefs.current[mediaType.type] = el)}
                  type="file"
                  accept={mediaType.accept}
                  onChange={(e) => handleFileChange(e, mediaType.type, mediaType.maxSize)}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRefs.current[mediaType.type]?.click()}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-neutral-50'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', mediaType.bgColor)}>
                    <Icon size={18} className={mediaType.color} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-neutral-900">
                      {mediaType.label}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Max {formatFileSize(mediaType.maxSize)}
                    </div>
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
