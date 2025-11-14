import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Music, Video, File } from 'lucide-react';
import { MessageType } from '@/types/models.types';

interface FilePreviewProps {
  file: File;
  preview: string;
  type: MessageType;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, preview, type, onRemove }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    switch (type) {
      case 'audio':
        return <Music size={24} className="text-accent-600" />;
      case 'video':
        return <Video size={24} className="text-secondary-600" />;
      case 'document':
        return <FileText size={24} className="text-success-600" />;
      default:
        return <File size={24} className="text-neutral-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative inline-block"
    >
      <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
        {/* Preview/Icon */}
        <div className="flex-shrink-0">
          {type === 'image' ? (
            <img
              src={preview}
              alt={file.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : type === 'video' ? (
            <div className="relative w-16 h-16 bg-neutral-900 rounded-lg overflow-hidden">
              <video src={preview} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Video size={24} className="text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-white border border-neutral-200 rounded-lg">
              {getFileIcon()}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500">{formatFileSize(file.size)}</span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500 capitalize">{type}</span>
          </div>
        </div>

        {/* Remove Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
          title="Remove file"
        >
          <X size={18} className="text-neutral-600" />
        </motion.button>
      </div>
    </motion.div>
  );
};
