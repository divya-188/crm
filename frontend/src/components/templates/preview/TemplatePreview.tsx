import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import { debounce } from 'lodash-es';

/**
 * TemplatePreview Component
 * 
 * Real-time WhatsApp template preview with:
 * - WhatsApp phone mockup design
 * - Message bubble rendering
 * - Placeholder replacement with sample values
 * - Header rendering (text and media)
 * - Footer rendering
 * - Button rendering
 * - Debounced updates on component changes (500ms)
 * 
 * Requirements: 6.2, 6.3, 6.6, 6.7
 */
export const TemplatePreview: React.FC = () => {
  const {
    components,
    sampleValues,
    displayName,
    isPreviewLoading,
    setIsPreviewLoading,
  } = useTemplateEditorStore();

  // Replace placeholders with sample values
  const replacePlaceholders = (text: string): string => {
    if (!text) return '';
    
    let result = text;
    const placeholderRegex = /\{\{(\d+)\}\}/g;
    
    result = result.replace(placeholderRegex, (match, index) => {
      const sampleValue = sampleValues[index];
      if (sampleValue) {
        return sampleValue;
      }
      // If no sample value, show placeholder with styling indicator
      return `[${match}]`;
    });
    
    return result;
  };

  // Debounced preview update simulation
  const debouncedPreviewUpdate = useMemo(
    () =>
      debounce(() => {
        setIsPreviewLoading(true);
        // Simulate preview generation delay
        setTimeout(() => {
          setIsPreviewLoading(false);
        }, 300);
      }, 500),
    [setIsPreviewLoading]
  );

  // Trigger preview update when components or sample values change
  useEffect(() => {
    debouncedPreviewUpdate();
    
    return () => {
      debouncedPreviewUpdate.cancel();
    };
  }, [components, sampleValues, debouncedPreviewUpdate]);

  // Get current time for message timestamp
  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Render header based on type
  const renderHeader = () => {
    if (!components.header) return null;

    const { type, text, mediaUrl } = components.header;

    switch (type) {
      case 'TEXT':
        return (
          <div className="mb-2 font-semibold text-gray-900">
            {replacePlaceholders(text || '')}
          </div>
        );

      case 'IMAGE':
        return (
          <div className="mb-2 -mx-2 -mt-2">
            {mediaUrl ? (
              <img
                src={mediaUrl}
                alt="Header"
                className="w-full rounded-t-lg object-cover max-h-48"
              />
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded-t-lg">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Image preview</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'VIDEO':
        return (
          <div className="mb-2 -mx-2 -mt-2">
            {mediaUrl ? (
              <video
                src={mediaUrl}
                controls
                className="w-full rounded-t-lg max-h-48"
              />
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded-t-lg">
                <div className="text-center">
                  <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Video preview</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'DOCUMENT':
        return (
          <div className="mb-2 -mx-2 -mt-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
              <FileText className="h-8 w-8 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {mediaUrl ? 'Document.pdf' : 'Document preview'}
                </p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
            </div>
          </div>
        );

      case 'LOCATION':
        return (
          <div className="mb-2 -mx-2 -mt-2">
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-t-lg">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-gray-700 font-medium">Location</p>
                <p className="text-xs text-gray-500">Map preview</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render buttons
  const renderButtons = () => {
    if (!components.buttons || components.buttons.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {components.buttons.map((button, index) => {
          let buttonIcon = null;
          let buttonText = button.text;

          if (button.type === 'PHONE_NUMBER') {
            buttonIcon = <Phone className="h-4 w-4 mr-2" />;
          } else if (button.type === 'URL') {
            buttonIcon = (
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            );
          }

          return (
            <button
              key={index}
              type="button"
              className="w-full flex items-center justify-center rounded-md border-2 border-teal-600 bg-white py-2.5 px-4 text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {buttonIcon}
              {buttonText}
            </button>
          );
        })}
      </div>
    );
  };

  const bodyText = components.body?.text || '';
  const footerText = components.footer?.text || '';
  const hasContent = bodyText || components.header || footerText || components.buttons;

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isPreviewLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg"
        >
          <div className="flex items-center space-x-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Updating preview...</span>
          </div>
        </motion.div>
      )}

      {/* WhatsApp Phone Mockup */}
      <div className="mx-auto max-w-sm">
        {/* Phone Frame */}
        <div className="relative rounded-[2.5rem] border-[14px] border-gray-900 bg-white shadow-2xl overflow-hidden">
          {/* Phone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-3xl z-10" />

          {/* Phone Screen */}
          <div className="relative bg-[#ECE5DD] min-h-[600px] max-h-[600px] overflow-y-auto">
            {/* WhatsApp Header */}
            <div className="sticky top-0 z-20 bg-[#075E54] px-4 py-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Business Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {displayName ? displayName.charAt(0).toUpperCase() : 'B'}
                      </span>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {displayName || 'Business Name'}
                    </div>
                    <div className="flex items-center text-xs text-gray-200">
                      <span className="truncate">WhatsApp Business</span>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center space-x-4 text-white">
                  <Video className="h-5 w-5" />
                  <Phone className="h-5 w-5" />
                  <MoreVertical className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-4 space-y-2">
              {/* Empty State */}
              {!hasContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center py-20"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      No content yet
                    </p>
                    <p className="text-xs text-gray-500">
                      Start adding components to see the preview
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Message Bubble */}
              {hasContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%]">
                    {/* Message Container */}
                    <div className="rounded-lg bg-[#DCF8C6] shadow-sm">
                      <div className="px-3 py-2">
                        {/* Header Component */}
                        {renderHeader()}

                        {/* Body Component */}
                        {bodyText && (
                          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {replacePlaceholders(bodyText)}
                          </div>
                        )}

                        {/* Footer Component */}
                        {footerText && (
                          <div className="mt-2 text-xs text-gray-600 italic">
                            {footerText}
                          </div>
                        )}

                        {/* Timestamp and Status */}
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <span className="text-[10px] text-gray-600">
                            {currentTime}
                          </span>
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                      </div>

                      {/* Buttons Component */}
                      {renderButtons()}
                    </div>

                    {/* Message Tail */}
                    <div className="relative">
                      <div
                        className="absolute -top-2 right-0 w-0 h-0"
                        style={{
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: '8px solid #DCF8C6',
                          transform: 'translateX(4px)',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sample Placeholder Indicators */}
              {bodyText && Object.keys(sampleValues).length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3"
                >
                  <p className="text-xs text-amber-800">
                    <strong>Tip:</strong> Add sample values to see how placeholders will look with real data
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Phone Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full" />
        </div>

        {/* Preview Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This is how your template will appear in WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
