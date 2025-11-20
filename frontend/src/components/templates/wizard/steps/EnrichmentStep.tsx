import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Video, FileText, Type, Upload, X, AlertCircle } from 'lucide-react';
import { StepProps } from '../types';
import Input from '@/components/ui/Input';

const MAX_HEADER_LENGTH = 60;
const MAX_FOOTER_LENGTH = 60;

const HEADER_TYPES = [
  { value: 'none', label: 'None', icon: X, desc: 'No header' },
  { value: 'text', label: 'Text', icon: Type, desc: 'Simple text header' },
  { value: 'image', label: 'Image', icon: Image, desc: 'JPG, PNG (5MB max)' },
  { value: 'video', label: 'Video', icon: Video, desc: 'MP4 (16MB max)' },
  { value: 'document', label: 'Document', icon: FileText, desc: 'PDF (100MB max)' },
];

export function EnrichmentStep({ data, updateData }: StepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleHeaderTypeChange = (type: string) => {
    updateData({
      header: {
        type: type as any,
        text: type === 'text' ? data.header.text : undefined,
        mediaUrl: type !== 'text' && type !== 'none' ? data.header.mediaUrl : undefined,
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);

    try {
      // Validate file size
      const maxSizes = {
        image: 5 * 1024 * 1024, // 5MB
        video: 16 * 1024 * 1024, // 16MB
        document: 100 * 1024 * 1024, // 100MB
      };

      const maxSize = maxSizes[data.header.type as keyof typeof maxSizes];
      if (file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      }

      // Simulate upload (replace with actual upload logic)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      
      updateData({
        header: {
          ...data.header,
          mediaUrl: url,
          mediaHandle: `media_${Date.now()}`, // Replace with actual handle from API
        },
      });
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    updateData({
      header: {
        ...data.header,
        mediaUrl: undefined,
        mediaHandle: undefined,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Enrichment</h3>
        <p className="text-gray-600">Add optional header and footer to enhance your message</p>
      </div>

      {/* Header Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Header Type
        </label>
        <div className="grid grid-cols-5 gap-3">
          {HEADER_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.value}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleHeaderTypeChange(type.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  data.header.type === type.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${
                  data.header.type === type.value ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <div className="text-sm font-semibold text-gray-900">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Text Header Input */}
      {data.header.type === 'text' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Header Text
          </label>
          <Input
            value={data.header.text || ''}
            onChange={(e) => updateData({
              header: { ...data.header, text: e.target.value }
            })}
            placeholder="e.g., Order Confirmation"
            maxLength={MAX_HEADER_LENGTH}
          />
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-500">Can contain 1 placeholder: {`{{1}}`}</span>
            <span className={`font-medium ${
              (data.header.text?.length || 0) > MAX_HEADER_LENGTH * 0.8
                ? 'text-orange-600'
                : 'text-gray-600'
            }`}>
              {data.header.text?.length || 0} / {MAX_HEADER_LENGTH}
            </span>
          </div>
        </motion.div>
      )}

      {/* Media Upload */}
      {data.header.type !== 'none' && data.header.type !== 'text' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {!data.header.mediaUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="media-upload"
                className="hidden"
                accept={
                  data.header.type === 'image' ? 'image/jpeg,image/png' :
                  data.header.type === 'video' ? 'video/mp4' :
                  'application/pdf'
                }
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer flex flex-col items-center space-y-3"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {uploading ? 'Uploading...' : 'Upload Media'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {data.header.type === 'image' && 'JPG or PNG, max 5MB'}
                    {data.header.type === 'video' && 'MP4, max 16MB'}
                    {data.header.type === 'document' && 'PDF, max 100MB'}
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {data.header.type === 'image' && (
                <img
                  src={data.header.mediaUrl}
                  alt="Header"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              {data.header.type === 'video' && (
                <video
                  src={data.header.mediaUrl}
                  controls
                  className="w-full h-48 rounded-lg"
                />
              )}
              {data.header.type === 'document' && (
                <div className="flex items-center space-x-3 p-4">
                  <FileText className="w-12 h-12 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Document uploaded</div>
                    <div className="text-sm text-gray-600">PDF file ready</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-sm text-red-600 mt-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Footer (Optional)
        </label>
        <Input
          value={data.footer || ''}
          onChange={(e) => updateData({ footer: e.target.value })}
          placeholder="e.g., Reply STOP to unsubscribe"
          maxLength={MAX_FOOTER_LENGTH}
        />
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-gray-500">No placeholders allowed in footer</span>
          <span className={`font-medium ${
            (data.footer?.length || 0) > MAX_FOOTER_LENGTH * 0.8
              ? 'text-orange-600'
              : 'text-gray-600'
          }`}>
            {data.footer?.length || 0} / {MAX_FOOTER_LENGTH}
          </span>
        </div>
      </motion.div>

      {/* Skip Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <p className="text-sm text-blue-900">
          💡 <strong>Optional Step:</strong> Headers and footers can enhance your message but aren't required. 
          You can skip this step and continue to add buttons.
        </p>
      </motion.div>
    </div>
  );
}
