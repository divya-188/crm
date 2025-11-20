import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import { useDebounce } from '@/hooks/useDebounce';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';

/**
 * BodyEditor Component
 * 
 * Handles the body component of WhatsApp templates:
 * - Textarea with placeholder insertion
 * - Character count (max 1024)
 * - Placeholder insertion button
 * - Placeholder highlighting
 * - Real-time validation
 * - Placeholder list display
 * 
 * Requirements: 1.2, 2.1, 2.2, 6.5
 */
export const BodyEditor: React.FC = () => {
  const {
    components,
    updateBody,
    validationErrors,
  } = useTemplateEditorStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPlaceholderHighlight, setShowPlaceholderHighlight] = useState(true);
  const [localBodyText, setLocalBodyText] = useState('');

  const body = components.body;
  const bodyText = body?.text || '';
  const placeholders = body?.placeholders || [];

  // Debounce validation for 500ms to improve performance
  const debouncedBodyText = useDebounce(localBodyText, 500);

  // Initialize local state
  useEffect(() => {
    setLocalBodyText(bodyText);
  }, [bodyText]);

  // Update store with debounced value
  useEffect(() => {
    if (debouncedBodyText !== bodyText) {
      // Extract placeholders from text
      const placeholderNumbers = extractPlaceholders(debouncedBodyText);
      const uniquePlaceholders = [...new Set(placeholderNumbers)].sort((a, b) => a - b);

      // Update placeholders array
      const updatedPlaceholders = uniquePlaceholders.map((num) => {
        const existing = placeholders.find((p) => p.index === num);
        return existing || { index: num, example: '' };
      });

      updateBody({
        text: debouncedBodyText,
        placeholders: updatedPlaceholders,
      });
    }
  }, [debouncedBodyText]);

  // Constants for validation
  const MAX_BODY_LENGTH = 1024;

  // Get validation errors for body
  const getFieldError = (fieldName: string) => {
    return validationErrors.find((error) => error.field === fieldName);
  };

  const bodyTextError = getFieldError('body.text');

  // Extract placeholders from text
  const extractPlaceholders = (text: string): number[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    
    return matches.map((match) => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0]) : 0;
    }).filter(n => n > 0);
  };

  // Validate body text
  const validateBodyText = (text: string): string | null => {
    if (!text || text.trim() === '') {
      return 'Body text is required';
    }

    if (text.length > MAX_BODY_LENGTH) {
      return `Body text must not exceed ${MAX_BODY_LENGTH} characters`;
    }

    // Check for invalid placeholder formats
    if (/\{[^{].*?\}/.test(text)) {
      return 'Invalid placeholder format. Use {{1}}, {{2}}, etc. (not {1})';
    }

    if (/\{\{\}\}/.test(text)) {
      return 'Empty placeholders {{}} are not allowed';
    }

    if (/\{\{[a-zA-Z_]+\}\}/.test(text)) {
      return 'Named placeholders like {{name}} are not allowed. Use {{1}}, {{2}}, etc.';
    }

    if (/%s/.test(text)) {
      return 'Format specifiers like %s are not allowed. Use {{1}}, {{2}}, etc.';
    }

    // Check for stacked placeholders
    if (/\{\{\d+\}\}\{\{\d+\}\}/.test(text)) {
      return 'Placeholders cannot be stacked without separators (e.g., {{1}}{{2}})';
    }

    // Check for leading/trailing placeholders
    const trimmedText = text.trim();
    if (/^\{\{\d+\}\}/.test(trimmedText)) {
      return 'Body text should not start with a placeholder';
    }

    if (/\{\{\d+\}\}$/.test(trimmedText)) {
      return 'Body text should not end with a placeholder';
    }

    // Check for sequential numbering
    const placeholderNumbers = extractPlaceholders(text);
    if (placeholderNumbers.length > 0) {
      const sortedNumbers = [...new Set(placeholderNumbers)].sort((a, b) => a - b);
      for (let i = 0; i < sortedNumbers.length; i++) {
        if (sortedNumbers[i] !== i + 1) {
          return `Placeholders must be sequential starting from {{1}}. Missing {{${i + 1}}}`;
        }
      }
    }

    return null;
  };

  // Handle text change (now updates local state immediately, debounced update to store)
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalBodyText(text);
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = bodyText;

    // Find the next placeholder number
    const existingNumbers = extractPlaceholders(text);
    const nextNumber = existingNumbers.length > 0 
      ? Math.max(...existingNumbers) + 1 
      : 1;

    const placeholder = `{{${nextNumber}}}`;
    const newText = text.substring(0, start) + placeholder + text.substring(end);

    // Update body with new text
    const placeholderNumbers = extractPlaceholders(newText);
    const uniquePlaceholders = [...new Set(placeholderNumbers)].sort((a, b) => a - b);
    const updatedPlaceholders = uniquePlaceholders.map((num) => {
      const existing = placeholders.find((p) => p.index === num);
      return existing || { index: num, example: '' };
    });

    updateBody({
      text: newText,
      placeholders: updatedPlaceholders,
    });

    // Set cursor position after placeholder
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + placeholder.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Highlight placeholders in text
  const highlightPlaceholders = (text: string): React.ReactNode => {
    if (!showPlaceholderHighlight) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = /\{\{\d+\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add highlighted placeholder
      parts.push(
        <span
          key={`placeholder-${match.index}`}
          className="inline-block rounded bg-blue-100 px-1 py-0.5 text-blue-700 font-medium"
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  // Use debounced value for validation to avoid excessive validation calls
  const textValidationError = debouncedBodyText ? validateBodyText(debouncedBodyText) : null;
  const hasTextError = !!bodyTextError?.message || !!textValidationError;
  const textError = bodyTextError?.message || textValidationError;

  const placeholderCount = extractPlaceholders(localBodyText).length;

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
          <label htmlFor="body-text" className="flex items-center text-sm font-medium text-gray-700">
            Body Text
            <span className="ml-1 text-red-500">*</span>
            <Tooltip content="The main message content. Use {{1}}, {{2}}, etc. for dynamic placeholders.">
              <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
            </Tooltip>
          </label>
        </div>

        {/* Placeholder Highlight Toggle */}
        <button
          type="button"
          onClick={() => setShowPlaceholderHighlight(!showPlaceholderHighlight)}
          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900"
        >
          {showPlaceholderHighlight ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Highlighting On</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>Highlighting Off</span>
            </>
          )}
        </button>
      </div>

      {/* Textarea with Placeholder Insertion */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          id="body-text"
          value={localBodyText}
          onChange={handleTextChange}
          placeholder="Enter your message here. Use {{1}}, {{2}} for dynamic content..."
          rows={8}
          maxLength={MAX_BODY_LENGTH}
          className={`font-mono ${hasTextError ? 'border-red-500 focus:ring-red-500' : ''}`}
        />

        {/* Insert Placeholder Button */}
        <div className="absolute bottom-3 right-3">
          <Tooltip content="Insert a placeholder at cursor position">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={insertPlaceholder}
              className="shadow-sm"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              <Hash className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Character Count and Placeholder Count */}
      <div className="flex justify-between text-xs">
        <span className={localBodyText.length > MAX_BODY_LENGTH ? 'text-red-600' : 'text-gray-500'}>
          {localBodyText.length}/{MAX_BODY_LENGTH} characters
        </span>
        {placeholderCount > 0 && (
          <span className="text-gray-500">
            {placeholderCount} placeholder{placeholderCount !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Validation Feedback */}
      {localBodyText && (
        <div className="flex items-start space-x-2">
          {hasTextError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{textError}</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-600">Valid body text</p>
            </>
          )}
        </div>
      )}

      {/* Placeholder Preview with Highlighting */}
      {showPlaceholderHighlight && localBodyText && placeholderCount > 0 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Preview with Highlighting
          </h4>
          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words font-mono">
            {highlightPlaceholders(localBodyText)}
          </div>
        </div>
      )}

      {/* Placeholder List Display */}
      {placeholders.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Hash className="mr-2 h-4 w-4" />
            Placeholders Found ({placeholders.length})
          </h4>
          <div className="space-y-2">
            {placeholders.map((placeholder) => (
              <div
                key={placeholder.index}
                className="flex items-center space-x-3 rounded-lg bg-white p-3 border border-gray-200"
              >
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {placeholder.index}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Placeholder {'{{'}{placeholder.index}{'}}'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {placeholder.example ? (
                      <>Example: <span className="font-medium text-gray-700">{placeholder.example}</span></>
                    ) : (
                      <span className="text-amber-600">No example value set</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-600">
            <strong>Note:</strong> Set example values for each placeholder in the Placeholder Manager section below.
          </p>
        </div>
      )}

      {/* Guidelines */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900 mb-2">
          Body Text Guidelines
        </p>
        <ul className="space-y-1 text-xs text-blue-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Use {'{{1}}'}, {'{{2}}'}, etc. for dynamic placeholders (must be sequential)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Maximum {MAX_BODY_LENGTH} characters including placeholders</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Placeholders cannot be at the start or end of the message</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Add spaces or text between consecutive placeholders</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Keep messages clear, concise, and valuable to recipients</span>
          </li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click the <Plus className="inline h-3 w-3" /><Hash className="inline h-3 w-3" /> button to insert placeholders
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => textareaRef.current?.focus()}
          className="text-xs"
        >
          Focus Editor
        </Button>
      </div>
    </motion.div>
  );
};

export default BodyEditor;
