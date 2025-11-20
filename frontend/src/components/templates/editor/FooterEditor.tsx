import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';

/**
 * FooterEditor Component
 * 
 * Handles the footer component of WhatsApp templates:
 * - Footer text input
 * - Character count (max 60)
 * - Validation that no placeholders are allowed
 * - Footer toggle (optional)
 * 
 * Requirements: 1.4, 1.6
 */
export const FooterEditor: React.FC = () => {
  const {
    components,
    updateFooter,
    validationErrors,
  } = useTemplateEditorStore();

  const footer = components.footer;
  const footerText = footer?.text || '';
  const [isFooterEnabled, setIsFooterEnabled] = useState(!!footer);

  // Constants for validation
  const MAX_FOOTER_LENGTH = 60;

  // Get validation errors for footer
  const getFieldError = (fieldName: string) => {
    return validationErrors.find((error) => error.field === fieldName);
  };

  const footerTextError = getFieldError('footer.text');

  // Validate footer text
  const validateFooterText = (text: string): string | null => {
    if (!text || text.trim() === '') {
      return null; // Footer is optional, empty is valid
    }

    if (text.length > MAX_FOOTER_LENGTH) {
      return `Footer text must not exceed ${MAX_FOOTER_LENGTH} characters`;
    }

    // Check for placeholders (not allowed in footer)
    if (/\{\{\d+\}\}/.test(text)) {
      return 'Placeholders are not allowed in footer text';
    }

    // Check for other placeholder-like patterns
    if (/\{[^{].*?\}/.test(text) || /\{\{\}\}/.test(text) || /\{\{[a-zA-Z_]+\}\}/.test(text)) {
      return 'Placeholders are not allowed in footer text';
    }

    if (/%s/.test(text)) {
      return 'Format specifiers like %s are not allowed in footer text';
    }

    return null;
  };

  // Handle footer toggle
  const handleFooterToggle = () => {
    const newEnabled = !isFooterEnabled;
    setIsFooterEnabled(newEnabled);

    if (newEnabled) {
      // Enable footer with empty text
      updateFooter({
        text: '',
      });
    } else {
      // Disable footer
      updateFooter(undefined);
    }
  };

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    updateFooter({
      text,
    });
  };

  const textValidationError = footerText ? validateFooterText(footerText) : null;
  const hasTextError = !!footerTextError?.message || !!textValidationError;
  const textError = footerTextError?.message || textValidationError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <label className="flex items-center text-sm font-medium text-gray-700">
            Footer Text
            <Tooltip content="Add an optional footer to your template. Footers appear at the bottom of the message in a smaller, muted font.">
              <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
            </Tooltip>
          </label>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={handleFooterToggle}
          className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isFooterEnabled
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isFooterEnabled ? (
            <>
              <ToggleRight className="h-4 w-4" />
              <span>Enabled</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4" />
              <span>Disabled</span>
            </>
          )}
        </button>
      </div>

      {/* Footer Input (shown when enabled) */}
      <AnimatePresence mode="wait">
        {isFooterEnabled && (
          <motion.div
            key="footer-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Text Input */}
            <div>
              <Input
                id="footer-text"
                type="text"
                value={footerText}
                onChange={handleTextChange}
                placeholder="e.g., Reply STOP to unsubscribe"
                maxLength={MAX_FOOTER_LENGTH}
                className={hasTextError ? 'border-red-500 focus:ring-red-500' : ''}
              />

              {/* Character Count */}
              <div className="mt-1 flex justify-between text-xs">
                <span className={footerText.length > MAX_FOOTER_LENGTH ? 'text-red-600' : 'text-gray-500'}>
                  {footerText.length}/{MAX_FOOTER_LENGTH} characters
                </span>
              </div>
            </div>

            {/* Validation Feedback */}
            {footerText && (
              <div className="flex items-start space-x-2">
                {hasTextError ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{textError}</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-600">Valid footer text</p>
                  </>
                )}
              </div>
            )}

            {/* No Placeholders Warning */}
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    No Placeholders Allowed
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Footer text cannot contain placeholders like {'{{1}}'} or {'{{2}}'}. 
                    Use static text only.
                  </p>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                Footer Guidelines
              </p>
              <ul className="space-y-1 text-xs text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Maximum {MAX_FOOTER_LENGTH} characters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>No placeholders or dynamic content allowed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use for disclaimers, unsubscribe instructions, or branding</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Appears in smaller, muted text below the main message</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep it short and relevant to the message</span>
                </li>
              </ul>
            </div>

            {/* Example Footers */}
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Example Footers
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => updateFooter({ text: 'Reply STOP to unsubscribe' })}
                  className="w-full text-left rounded-lg bg-white p-2 text-xs text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Reply STOP to unsubscribe
                </button>
                <button
                  type="button"
                  onClick={() => updateFooter({ text: 'Powered by YourCompany' })}
                  className="w-full text-left rounded-lg bg-white p-2 text-xs text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Powered by YourCompany
                </button>
                <button
                  type="button"
                  onClick={() => updateFooter({ text: 'This is an automated message' })}
                  className="w-full text-left rounded-lg bg-white p-2 text-xs text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  This is an automated message
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Click an example to use it as your footer
              </p>
            </div>
          </motion.div>
        )}

        {/* Disabled State Message */}
        {!isFooterEnabled && (
          <motion.div
            key="footer-disabled"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg bg-gray-50 p-4"
          >
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-gray-700">
                  Footer is Optional
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Footers appear at the bottom of your message in a smaller, muted font. 
                  They're great for disclaimers, unsubscribe instructions, or branding.
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Click the toggle above to enable the footer for this template.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FooterEditor;
