import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  Type,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import toast from '@/lib/toast';
import { templatesService } from '@/services/templates.service';

type HeaderType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'NONE';

interface MediaUploadResponse {
  mediaHandle: string;
  url: string;
}

/**
 * HeaderEditor Component
 * 
 * Handles the header component of WhatsApp templates:
 * - Header type selection (TEXT, IMAGE, VIDEO, DOCUMENT, LOCATION, or NONE)
 * - Text header with placeholder support (max 1 placeholder)
 * - Media upload for IMAGE/VIDEO/DOCUMENT types
 * - Media preview
 * - Character count display (max 60 for text)
 * - Real-time validation feedback
 * 
 * Requirements: 1.5, 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const HeaderEditor: React.FC = () => {
  const {
    components,
    updateHeader,
    validationErrors,
  } = useTemplateEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const header = components.header;
  const headerType: HeaderType = header?.type || 'NONE';
  const headerText = header?.text || '';
  const mediaUrl = header?.mediaUrl || '';
  const mediaHandle = header?.mediaHandle || '';

  // Constants for validation
  const MAX_TEXT_LENGTH = 60;
  const MAX_PLACEHOLDERS = 1;
  const MAX_FILE_SIZES = {
    IMAGE: 5 * 1024 * 1024, // 5MB
    VIDEO: 16 * 1024 * 1024, // 16MB
    DOCUMENT: 100 * 1024 * 1024, // 100MB
  };
  const ALLOWED_FORMATS = {
    IMAGE: ['image/jpeg', 'image/png'],
    VIDEO: ['video/mp4', 'video/3gpp'],
    DOCUMENT: ['application/pdf'],
  };

  // Get validation errors for header
  const getFieldError = (fieldName: string) => {
    return validationErrors.find((error) => error.field === fieldName);
  };

  const headerTextError = getFieldError('header.text');
  const headerMediaError = getFieldError('header.media');

  // Validate header text
  const validateHeaderText = (text: string): string | null => {
    if (!text) {
      return 'Header text is required when header type is TEXT';
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return `Header text must not exceed ${MAX_TEXT_LENGTH} characters`;
    }

    // Check placeholder count
    const placeholderMatches = text.match(/\{\{\d+\}\}/g);
    if (placeholderMatches && placeholderMatches.length > MAX_PLACEHOLDERS) {
      return `Header can contain maximum ${MAX_PLACEHOLDERS} placeholder`;
    }

    // Check for invalid placeholder formats
    if (/\{[^{].*?\}/.test(text) || /\{\{\}\}/.test(text) || /\{\{[a-zA-Z_]+\}\}/.test(text)) {
      return 'Invalid placeholder format. Use {{1}} only';
    }

    return null;
  };

  // Handle header type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as HeaderType;

    if (newType === 'NONE') {
      updateHeader(undefined);
    } else if (newType === 'TEXT') {
      updateHeader({
        type: 'TEXT',
        text: '',
      });
    } else if (newType === 'LOCATION') {
      updateHeader({
        type: 'LOCATION',
      });
    } else {
      // IMAGE, VIDEO, DOCUMENT
      updateHeader({
        type: newType,
        mediaUrl: '',
        mediaHandle: '',
      });
    }
  };

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    updateHeader({
      type: 'TEXT',
      text,
    });
  };

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedFormats = ALLOWED_FORMATS[headerType as keyof typeof ALLOWED_FORMATS];
    if (!allowedFormats?.includes(file.type)) {
      toast.error(`Invalid file format. Allowed formats: ${allowedFormats?.join(', ')}`);
      return;
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[headerType as keyof typeof MAX_FILE_SIZES];
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${formatFileSize(maxSize)} limit`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', headerType);

      const response = await templatesService.uploadMedia(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update header with media info
      updateHeader({
        type: headerType as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
        mediaUrl: response.url,
        mediaHandle: response.mediaHandle,
      });

      toast.success('Media uploaded successfully');
    } catch (error: any) {
      console.error('Media upload failed:', error);
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle media removal
  const handleRemoveMedia = () => {
    updateHeader({
      type: headerType as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
      mediaUrl: '',
      mediaHandle: '',
    });
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get header type icon
  const getHeaderTypeIcon = (type: HeaderType) => {
    switch (type) {
      case 'TEXT':
        return <Type className="h-4 w-4" />;
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />;
      case 'LOCATION':
        return <MapPin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get file format description
  const getFormatDescription = (type: HeaderType): string => {
    switch (type) {
      case 'IMAGE':
        return 'JPEG, PNG (max 5MB)';
      case 'VIDEO':
        return 'MP4, 3GPP (max 16MB)';
      case 'DOCUMENT':
        return 'PDF (max 100MB)';
      default:
        return '';
    }
  };

  const textValidationError = headerType === 'TEXT' && headerText ? validateHeaderText(headerText) : null;
  const hasTextError = !!headerTextError?.message || !!textValidationError;
  const textError = headerTextError?.message || textValidationError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      {/* Header Type Selector */}
      <div>
        <label htmlFor="header-type" className="mb-2 flex items-center text-sm font-medium text-gray-700">
          Header Type
          <Tooltip content="Choose the type of header for your template. Headers are optional but can make your message more engaging.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </label>

        <Select
          id="header-type"
          value={headerType}
          onChange={handleTypeChange}
          options={[
            { value: 'NONE', label: 'No Header' },
            { value: 'TEXT', label: 'Text' },
            { value: 'IMAGE', label: 'Image' },
            { value: 'VIDEO', label: 'Video' },
            { value: 'DOCUMENT', label: 'Document' },
            { value: 'LOCATION', label: 'Location' },
          ]}
        />

        <p className="mt-1 text-xs text-gray-500">
          Optional. Add a header to make your template more visually appealing.
        </p>
      </div>

      {/* Text Header Input */}
      <AnimatePresence mode="wait">
        {headerType === 'TEXT' && (
          <motion.div
            key="text-header"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label htmlFor="header-text" className="mb-2 flex items-center text-sm font-medium text-gray-700">
              Header Text
              <span className="ml-1 text-red-500">*</span>
              <Tooltip content="Enter the header text. You can use one placeholder {{1}} for dynamic content.">
                <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
              </Tooltip>
            </label>

            <Input
              id="header-text"
              type="text"
              value={headerText}
              onChange={handleTextChange}
              placeholder="e.g., Welcome {{1}}!"
              maxLength={MAX_TEXT_LENGTH}
              className={hasTextError ? 'border-red-500 focus:ring-red-500' : ''}
            />

            {/* Character Count */}
            <div className="mt-1 flex justify-between text-xs">
              <span className={headerText.length > MAX_TEXT_LENGTH ? 'text-red-600' : 'text-gray-500'}>
                {headerText.length}/{MAX_TEXT_LENGTH} characters
              </span>
              {headerText.match(/\{\{\d+\}\}/g)?.length && (
                <span className="text-gray-500">
                  {headerText.match(/\{\{\d+\}\}/g)?.length}/{MAX_PLACEHOLDERS} placeholder
                </span>
              )}
            </div>

            {/* Validation Feedback */}
            {headerText && (
              <div className="mt-2 flex items-start space-x-2">
                {hasTextError ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{textError}</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-600">Valid header text</p>
                  </>
                )}
              </div>
            )}

            {/* Placeholder Info */}
            <div className="mt-3 rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Use {{'{{'}}1{{'}}'}} to add a dynamic placeholder. 
                Headers can contain a maximum of 1 placeholder.
              </p>
            </div>
          </motion.div>
        )}

        {/* Media Upload (IMAGE, VIDEO, DOCUMENT) */}
        {(headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') && (
          <motion.div
            key="media-header"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* File Input (Hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FORMATS[headerType as keyof typeof ALLOWED_FORMATS]?.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Area */}
            {!mediaUrl && !isUploading && (
              <div>
                <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                  Upload {headerType.charAt(0) + headerType.slice(1).toLowerCase()}
                  <span className="ml-1 text-red-500">*</span>
                  <Tooltip content={`Upload a ${headerType.toLowerCase()} file. ${getFormatDescription(headerType)}`}>
                    <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </label>

                <button
                  type="button"
                  onClick={handleFileSelect}
                  className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    {getHeaderTypeIcon(headerType)}
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Click to upload {headerType.toLowerCase()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {getFormatDescription(headerType)}
                  </p>
                </button>

                {headerMediaError && (
                  <div className="mt-2 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{headerMediaError.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Uploading...</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{uploadProgress}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Media Preview */}
            {mediaUrl && !isUploading && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Preview Thumbnail */}
                    <div className="flex-shrink-0">
                      {headerType === 'IMAGE' && (
                        <img
                          src={mediaUrl}
                          alt="Header preview"
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      )}
                      {headerType === 'VIDEO' && (
                        <video
                          src={mediaUrl}
                          className="h-20 w-20 rounded-lg object-cover"
                          controls={false}
                        />
                      )}
                      {headerType === 'DOCUMENT' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Media Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-700">
                          {headerType.charAt(0) + headerType.slice(1).toLowerCase()} uploaded
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 truncate">
                        Media ID: {mediaHandle}
                      </p>
                      {headerType === 'IMAGE' && (
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700"
                        >
                          View full size
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveMedia}
                    className="ml-2 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Replace Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileSelect}
                  className="mt-3 w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Replace {headerType.toLowerCase()}
                </Button>
              </div>
            )}

            {/* Format Guidelines */}
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-yellow-800">
                <strong>Guidelines:</strong>
              </p>
              <ul className="mt-1 list-disc list-inside space-y-1 text-xs text-yellow-700">
                {headerType === 'IMAGE' && (
                  <>
                    <li>Use high-quality images (recommended: 800x418px)</li>
                    <li>Supported formats: JPEG, PNG</li>
                    <li>Maximum file size: 5MB</li>
                  </>
                )}
                {headerType === 'VIDEO' && (
                  <>
                    <li>Keep videos short and engaging (under 60 seconds recommended)</li>
                    <li>Supported formats: MP4, 3GPP</li>
                    <li>Maximum file size: 16MB</li>
                  </>
                )}
                {headerType === 'DOCUMENT' && (
                  <>
                    <li>Use clear, readable documents</li>
                    <li>Supported format: PDF only</li>
                    <li>Maximum file size: 100MB</li>
                  </>
                )}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Location Header */}
        {headerType === 'LOCATION' && (
          <motion.div
            key="location-header"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg bg-blue-50 p-4"
          >
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">
                  Location Header
                </h4>
                <p className="mt-1 text-sm text-blue-700">
                  Location headers allow you to share a specific location with your customers.
                  The location details will be provided when sending the message.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HeaderEditor;
