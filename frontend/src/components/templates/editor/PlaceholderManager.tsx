import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  AlertCircle,
  CheckCircle2,
  Info,
  MapPin,
  Trash2,
  Plus,
  FileText,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import Badge from '@/components/ui/Badge';

/**
 * PlaceholderManager Component
 * 
 * Manages placeholders and their sample values across all template components:
 * - Display list of all placeholders with indexes
 * - Implement sample value inputs for each placeholder
 * - Add placeholder validation status
 * - Create add/remove placeholder controls
 * - Show placeholder usage locations
 * 
 * Requirements: 2.4, 6.1, 6.4, 2.7
 */
export const PlaceholderManager: React.FC = () => {
  const {
    components,
    sampleValues,
    updateSampleValue,
    validationErrors,
  } = useTemplateEditorStore();

  // Extract all placeholders from all components
  const allPlaceholders = useMemo(() => {
    const placeholderMap = new Map<number, {
      index: number;
      sampleValue: string;
      locations: Array<{ component: string; context: string }>;
      hasError: boolean;
      errorMessage?: string;
    }>();

    // Extract from header (if TEXT type with placeholder)
    if (components.header?.type === 'TEXT' && components.header.text) {
      const headerMatches = components.header.text.match(/\{\{(\d+)\}\}/g);
      if (headerMatches) {
        headerMatches.forEach(match => {
          const num = parseInt(match.match(/\d+/)?.[0] || '0');
          if (num > 0) {
            if (!placeholderMap.has(num)) {
              placeholderMap.set(num, {
                index: num,
                sampleValue: sampleValues[num.toString()] || '',
                locations: [],
                hasError: false,
              });
            }
            placeholderMap.get(num)!.locations.push({
              component: 'Header',
              context: getContextAroundPlaceholder(components.header.text!, match),
            });
          }
        });
      }
    }

    // Extract from body
    if (components.body?.text) {
      const bodyMatches = components.body.text.match(/\{\{(\d+)\}\}/g);
      if (bodyMatches) {
        bodyMatches.forEach(match => {
          const num = parseInt(match.match(/\d+/)?.[0] || '0');
          if (num > 0) {
            if (!placeholderMap.has(num)) {
              placeholderMap.set(num, {
                index: num,
                sampleValue: sampleValues[num.toString()] || '',
                locations: [],
                hasError: false,
              });
            }
            placeholderMap.get(num)!.locations.push({
              component: 'Body',
              context: getContextAroundPlaceholder(components.body.text!, match),
            });
          }
        });
      }
    }

    // Extract from buttons (URL buttons can have placeholders)
    if (components.buttons) {
      components.buttons.forEach((button, btnIndex) => {
        if (button.type === 'URL' && button.url) {
          const urlMatches = button.url.match(/\{\{(\d+)\}\}/g);
          if (urlMatches) {
            urlMatches.forEach(match => {
              const num = parseInt(match.match(/\d+/)?.[0] || '0');
              if (num > 0) {
                if (!placeholderMap.has(num)) {
                  placeholderMap.set(num, {
                    index: num,
                    sampleValue: sampleValues[num.toString()] || '',
                    locations: [],
                    hasError: false,
                  });
                }
                placeholderMap.get(num)!.locations.push({
                  component: `Button ${btnIndex + 1} (URL)`,
                  context: button.url!,
                });
              }
            });
          }
        }
      });
    }

    // Check for validation errors
    validationErrors.forEach(error => {
      if (error.field.includes('placeholder') || error.field.includes('sampleValue')) {
        const match = error.field.match(/\d+/);
        if (match) {
          const num = parseInt(match[0]);
          if (placeholderMap.has(num)) {
            placeholderMap.get(num)!.hasError = true;
            placeholderMap.get(num)!.errorMessage = error.message;
          }
        }
      }
    });

    // Convert to sorted array
    return Array.from(placeholderMap.values()).sort((a, b) => a.index - b.index);
  }, [components, sampleValues, validationErrors]);

  // Get context around placeholder (20 chars before and after)
  function getContextAroundPlaceholder(text: string, placeholder: string): string {
    const index = text.indexOf(placeholder);
    if (index === -1) return placeholder;

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + placeholder.length + 20);
    
    let context = text.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  // Validate sample value
  const validateSampleValue = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Sample value is required';
    }

    if (value.length > 100) {
      return 'Sample value must not exceed 100 characters';
    }

    // Check for special characters that might break URLs
    if (/[<>{}[\]\\]/.test(value)) {
      return 'Sample value contains invalid characters';
    }

    return null;
  }

  // Handle sample value change
  const handleSampleValueChange = (index: number, value: string) => {
    updateSampleValue(index, value);
  };

  // Check if all placeholders have sample values
  const allPlaceholdersHaveSamples = allPlaceholders.every(p => p.sampleValue.trim() !== '');
  const missingCount = allPlaceholders.filter(p => p.sampleValue.trim() === '').length;

  // Check for sequential numbering
  const hasSequentialNumbering = useMemo(() => {
    if (allPlaceholders.length === 0) return true;
    
    for (let i = 0; i < allPlaceholders.length; i++) {
      if (allPlaceholders[i].index !== i + 1) {
        return false;
      }
    }
    return true;
  }, [allPlaceholders]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Hash className="mr-2 h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Placeholder Manager
          </h3>
          <Tooltip content="Manage all placeholders and their sample values. Sample values are required for template submission.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </div>

        {allPlaceholders.length > 0 && (
          <Badge variant={allPlaceholdersHaveSamples ? 'success' : 'warning'}>
            {allPlaceholders.length} Placeholder{allPlaceholders.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Status Summary */}
      {allPlaceholders.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-start space-x-3">
            {allPlaceholdersHaveSamples ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    All placeholders have sample values
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Your template is ready for preview and submission
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    {missingCount} placeholder{missingCount !== 1 ? 's' : ''} missing sample value{missingCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Sample values are required for all placeholders before submission
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Sequential numbering check */}
          {!hasSequentialNumbering && (
            <div className="flex items-start space-x-3 mt-3 pt-3 border-t border-gray-200">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Placeholders are not sequential
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Placeholders must be numbered sequentially starting from {'{{1}}'}, {'{{2}}'}, etc.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {allPlaceholders.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Hash className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            No placeholders found
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Add placeholders to your template using the format {'{{1}}'}, {'{{2}}'}, etc.
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Placeholders can be added in the Header (TEXT only) or Body</p>
            <p>• URL buttons can also contain placeholders</p>
            <p>• Use the <Plus className="inline h-3 w-3" /><Hash className="inline h-3 w-3" /> button in the Body Editor</p>
          </div>
        </div>
      )}

      {/* Placeholder List */}
      <AnimatePresence mode="popLayout">
        {allPlaceholders.length > 0 && (
          <div className="space-y-3">
            {allPlaceholders.map((placeholder, index) => {
              const validationError = validateSampleValue(placeholder.sampleValue);
              const hasError = placeholder.hasError || !!validationError;

              return (
                <motion.div
                  key={placeholder.index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`rounded-lg border p-4 ${
                    hasError
                      ? 'border-red-300 bg-red-50'
                      : placeholder.sampleValue
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {/* Placeholder Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full font-semibold ${
                        hasError
                          ? 'bg-red-200 text-red-700'
                          : placeholder.sampleValue
                          ? 'bg-green-200 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {placeholder.index}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Placeholder {'{{'}{placeholder.index}{'}}'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Used in {placeholder.locations.length} location{placeholder.locations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Validation Status Icon */}
                    <div className="flex-shrink-0">
                      {hasError ? (
                        <Tooltip content={placeholder.errorMessage || validationError || 'Invalid sample value'}>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </Tooltip>
                      ) : placeholder.sampleValue ? (
                        <Tooltip content="Valid sample value">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </Tooltip>
                      ) : (
                        <Tooltip content="Sample value required">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Sample Value Input */}
                  <div className="mb-3">
                    <label
                      htmlFor={`sample-value-${placeholder.index}`}
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Sample Value <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id={`sample-value-${placeholder.index}`}
                      type="text"
                      value={placeholder.sampleValue}
                      onChange={(e) => handleSampleValueChange(placeholder.index, e.target.value)}
                      placeholder={`Example value for {{${placeholder.index}}}`}
                      maxLength={100}
                      className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {hasError && (
                      <p className="mt-1 text-xs text-red-600">
                        {placeholder.errorMessage || validationError}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {placeholder.sampleValue.length}/100 characters
                    </p>
                  </div>

                  {/* Usage Locations */}
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                      <p className="text-xs font-semibold text-gray-700">
                        Used In:
                      </p>
                    </div>
                    <div className="space-y-2">
                      {placeholder.locations.map((location, locIndex) => (
                        <div
                          key={locIndex}
                          className="flex items-start space-x-2 text-xs"
                        >
                          <Badge variant="secondary" className="flex-shrink-0">
                            {location.component}
                          </Badge>
                          <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-gray-800 font-mono break-all">
                            {location.context}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Guidelines */}
      {allPlaceholders.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-2">
                Sample Value Guidelines
              </p>
              <ul className="space-y-1 text-xs text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Provide realistic example values that represent actual data</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Sample values are shown to Meta during template review</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Avoid special characters like {'<, >, {, }, [, ], \\'}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep sample values concise (max 100 characters)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use the same language as your template</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {allPlaceholders.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {allPlaceholdersHaveSamples ? (
              <span className="flex items-center text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Ready for submission
              </span>
            ) : (
              <span className="flex items-center text-amber-600">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                Complete all sample values
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            Placeholders are automatically detected from your template
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PlaceholderManager;
