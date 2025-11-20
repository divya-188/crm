import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Image, Video, FileIcon, X, Upload, Lightbulb, Type, CheckCircle, AlertCircle } from 'lucide-react';
import { StepProps } from '../types';
import Input from '@/components/ui/Input';
import Toast from '@/lib/toast-system';

// Debounce hook
function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

const MAX_HEADER_TEXT_LENGTH = 60;

// File size limits in bytes
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  video: 16 * 1024 * 1024, // 16MB
  document: 100 * 1024 * 1024, // 100MB
};

// Accepted file types
const ACCEPTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png'],
  video: ['video/mp4'],
  document: ['application/pdf'],
};

const headerTypes = [
  { value: 'none', label: 'No Header', icon: X, description: 'Simple text-only message' },
  { value: 'TEXT', label: 'Text', icon: Type, description: 'Add a bold header text' },
  { value: 'IMAGE', label: 'Image', icon: Image, description: 'Include an image' },
  { value: 'VIDEO', label: 'Video', icon: Video, description: 'Attach a video' },
  { value: 'DOCUMENT', label: 'Document', icon: FileIcon, description: 'Share a PDF or file' },
];

export function HeaderStep({ data, updateData }: StepProps) {
  const [showTips, setShowTips] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [urlLoading, setUrlLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const headerTextLength = data.header.text?.length || 0;
  const isNearLimit = headerTextLength > MAX_HEADER_TEXT_LENGTH * 0.8;

  const handleTypeChange = (type: typeof data.header.type) => {
    const currentType = data.header.type;
    
    // Clear media when:
    // 1. Switching to 'none' or 'TEXT'
    // 2. Switching between different media types (IMAGE/VIDEO/DOCUMENT)
    const shouldClearMedia = 
      type === 'none' || 
      type === 'TEXT' || 
      (currentType !== 'none' && currentType !== 'TEXT' && type !== currentType);
    
    // Always clear local state when switching types
    setUploadedFile(null);
    setUploadError('');
    setUrlLoading(false);
    
    updateData({
      header: {
        type,
        text: type === 'TEXT' ? data.header.text : undefined,
        mediaUrl: shouldClearMedia ? undefined : data.header.mediaUrl,
        mediaHandle: shouldClearMedia ? undefined : data.header.mediaHandle,
      },
    });
  };

  const validateFile = (file: File, type: 'image' | 'video' | 'document'): string | null => {
    // Check file type
    const acceptedTypes = ACCEPTED_FILE_TYPES[type];
    if (!acceptedTypes.includes(file.type)) {
      const typeNames = {
        image: 'JPG or PNG',
        video: 'MP4',
        document: 'PDF',
      };
      return `Please upload a valid ${typeNames[type]} file`;
    }

    // Check file size
    const maxSize = FILE_SIZE_LIMITS[type];
    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size must be less than ${sizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const currentType = data.header.type.toLowerCase() as 'image' | 'video' | 'document';
    const error = validateFile(file, currentType);

    if (error) {
      setUploadError(error);
      Toast.error(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clear any previous errors
    setUploadError('');
    
    // Set the uploaded file
    setUploadedFile(file);
    
    // Create a temporary URL for preview
    const fileUrl = URL.createObjectURL(file);
    
    updateData({
      header: {
        ...data.header,
        mediaUrl: fileUrl,
        mediaHandle: file.name,
      },
    });

    Toast.success(`${file.name} uploaded successfully`);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError('');
    
    updateData({
      header: {
        ...data.header,
        mediaUrl: undefined,
        mediaHandle: undefined,
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAcceptAttribute = () => {
    const type = data.header.type.toLowerCase() as 'image' | 'video' | 'document';
    return ACCEPTED_FILE_TYPES[type]?.join(',') || '';
  };

  const tryLoad = (url: string, type: 'image' | 'video' | 'document'): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      if (type === 'image') {
        const img = document.createElement('img');
        img.onload = () => resolve(null);
        img.onerror = () => resolve('URL is not a valid image');
        img.src = url;
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.onloadeddata = () => resolve(null);
        video.onerror = () => resolve('URL is not a valid video');
        video.src = url;
      } else if (type === 'document') {
        fetch(url, { method: 'GET' })
          .then((res) => {
            if (res.ok) resolve(null);
            else resolve('URL is not a valid document');
          })
          .catch(() => resolve('URL is not a valid document'));
      }
    });
  };

  const validateUrl = async (url: string, type: 'image' | 'video' | 'document'): Promise<string | null> => {
    if (!url.trim()) return null;

    let parsed;
    try {
      parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        return 'URL must use HTTPS';
      }
    } catch {
      return 'Invalid URL format';
    }

    // Step 1: Try HEAD request
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'cors' });

      if (!response.ok) return 'URL is not accessible';

      const contentType = response.headers.get('content-type')?.toLowerCase() || '';

      if (!contentType) {
        // We didn't get content-type → fallback to GET test
        return await tryLoad(url, type);
      }

      const validContentTypes = {
        image: ['image/'],
        video: ['video/'],
        document: ['application/pdf'],
      };

      const isValid = validContentTypes[type].some((ct) => contentType.includes(ct));
      if (!isValid) return `URL is not a valid ${type} file`;

      return null; // VALID
    } catch {
      // HEAD failed → Try GET fallback
      return await tryLoad(url, type);
    }
  };

  const debouncedValidate = useDebounce(async (url: string) => {
    const currentType = data.header.type.toLowerCase() as 'image' | 'video' | 'document';
    const error = await validateUrl(url, currentType);
    setUploadError(error || '');
    setUrlLoading(false);
  }, 400);

  const handleUrlChange = (url: string) => {
    setUploadError('');
    setUrlLoading(!!url);

    updateData({
      header: {
        ...data.header,
        mediaUrl: url,
        mediaHandle: url ? 'url' : undefined,
      },
    });

    if (url) {
      debouncedValidate(url);
    } else {
      setUrlLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Header Content</h3>
        <p className="text-sm text-neutral-600">Add an optional header to make your message stand out</p>
      </div>

      {/* Tips Banner */}
      {showTips && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 mb-2">Header Best Practices</h4>
              <ul className="text-sm text-neutral-700 space-y-1">
                <li>• Headers grab attention - use them for important messages</li>
                <li>• Text headers are bold and limited to 60 characters</li>
                <li>• Media headers (image/video) increase engagement by 40%</li>
                <li>• Keep it relevant to your message body</li>
              </ul>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Header Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-semibold text-neutral-700 mb-3">
          Header Type
        </label>
        <div className="grid grid-cols-5 gap-3">
          {headerTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = data.header.type === type.value;
            
            return (
              <motion.button
                key={type.value}
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTypeChange(type.value as typeof data.header.type)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md shadow-sm'
                  }
                `}
              style={{
                boxShadow: isSelected 
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                  : undefined
              }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`
                    p-3 rounded-lg transition-colors
                    ${isSelected ? 'bg-primary-100' : 'bg-neutral-100'}
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-neutral-600'}`} />
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary-900' : 'text-neutral-700'}`}>
                    {type.label}
                  </span>
                </div>
                
                {isSelected && (
                  <motion.div
                    layoutId="header-type-indicator"
                    className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {headerTypes.find(t => t.value === data.header.type)?.description}
        </p>
      </motion.div>

      {/* Text Header Input */}
      {data.header.type === 'TEXT' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-neutral-700">
              Header Text *
            </label>
            <span className={`text-sm font-medium ${isNearLimit ? 'text-orange-600' : 'text-neutral-600'}`}>
              {headerTextLength} / {MAX_HEADER_TEXT_LENGTH}
            </span>
          </div>
          <Input
            value={data.header.text || ''}
            onChange={(e) => updateData({
              header: { ...data.header, text: e.target.value }
            })}
            placeholder="Order Confirmation"
            maxLength={MAX_HEADER_TEXT_LENGTH}
          />
          <p className="mt-2 text-xs text-neutral-500">
            This will appear in bold at the top of your message
          </p>
        </motion.div>
      )}

      {/* Media Header Input */}
      {data.header.type !== 'none' && data.header.type !== 'TEXT' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* File Upload Section */}
          {!uploadedFile && !data.header.mediaUrl && (
            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptAttribute()}
                onChange={handleFileSelect}
                className="hidden"
                id="header-file-upload"
              />
              <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h4 className="font-semibold text-neutral-900 mb-2">Upload {data.header.type}</h4>
              <p className="text-sm text-neutral-600 mb-4">
                {data.header.type === 'IMAGE' && 'JPG, PNG up to 5MB'}
                {data.header.type === 'VIDEO' && 'MP4 up to 16MB'}
                {data.header.type === 'DOCUMENT' && 'PDF up to 100MB'}
              </p>
              <label
                htmlFor="header-file-upload"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}

          {/* Uploaded File Preview - Compact */}
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 p-2 border border-success-600 bg-success-50 rounded-lg"
            >
              <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
              <span className="text-sm text-neutral-900 truncate flex-1">{uploadedFile.name}</span>
              <span className="text-xs text-neutral-500">({(uploadedFile.size / 1024).toFixed(0)} KB)</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-neutral-600 hover:text-red-600 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* File Upload Error - Compact */}
          {uploadError && uploadedFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-800">{uploadError}</p>
            </motion.div>
          )}

          {/* Divider */}
          {!uploadedFile && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">OR</span>
              </div>
            </div>
          )}

          {/* URL Input */}
          {!uploadedFile && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-700">
                Provide a URL
              </label>
              <Input
                value={data.header.mediaUrl || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={`https://example.com/${data.header.type === 'IMAGE' ? 'image.jpg' : data.header.type === 'VIDEO' ? 'video.mp4' : 'document.pdf'}`}
                type="url"
              />

              {/* Loading Spinner */}
              {urlLoading && (
                <div className="flex items-center space-x-2 text-xs text-neutral-500">
                  <svg className="animate-spin h-4 w-4 text-primary-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Validating URL…</span>
                </div>
              )}

              {/* Valid */}
              {!urlLoading && data.header.mediaUrl && !uploadError && (
                <div className="flex items-center space-x-1 text-xs text-success-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Valid URL</span>
                </div>
              )}

              {/* Error */}
              {!urlLoading && uploadError && (
                <div className="flex items-center space-x-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
