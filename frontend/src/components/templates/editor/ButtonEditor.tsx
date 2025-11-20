import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Info,
  Plus,
  X,
  MousePointerClick,
  Phone,
  ExternalLink,
  GripVertical,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';

type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
}

/**
 * ButtonEditor Component
 * 
 * Handles the button configuration of WhatsApp templates:
 * - Button type selector (Quick Reply, URL, Phone)
 * - Button text input with character count (max 25)
 * - URL input for URL buttons
 * - Phone number input for Phone buttons
 * - Add/remove button controls
 * - Display button count limits
 * - Button validation feedback
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6
 */
export const ButtonEditor: React.FC = () => {
  const {
    components,
    updateButtons,
    validationErrors,
  } = useTemplateEditorStore();

  const buttons = components.buttons || [];
  const [expandedButtonIndex, setExpandedButtonIndex] = useState<number | null>(
    buttons.length > 0 ? 0 : null
  );

  // Constants for validation
  const MAX_BUTTON_TEXT_LENGTH = 25;
  const MAX_QUICK_REPLY_BUTTONS = 3;
  const MAX_CTA_BUTTONS = 2;

  // Get validation errors for buttons
  const getFieldError = (fieldName: string) => {
    return validationErrors.find((error) => error.field === fieldName);
  };

  const buttonsError = getFieldError('buttons');

  // Validate button text
  const validateButtonText = (text: string): string | null => {
    if (!text || text.trim() === '') {
      return 'Button text is required';
    }

    if (text.length > MAX_BUTTON_TEXT_LENGTH) {
      return `Button text must not exceed ${MAX_BUTTON_TEXT_LENGTH} characters`;
    }

    return null;
  };

  // Validate URL
  const validateUrl = (url: string): string | null => {
    if (!url || url.trim() === '') {
      return 'URL is required for URL buttons';
    }

    try {
      new URL(url);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  };

  // Validate phone number (E.164 format)
  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return 'Phone number is required for Phone buttons';
    }

    // E.164 format: +[country code][number] (e.g., +1234567890)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phone)) {
      return 'Phone number must be in E.164 format (e.g., +1234567890)';
    }

    return null;
  };

  // Check for duplicate button text
  const hasDuplicateText = (text: string, currentIndex: number): boolean => {
    return buttons.some(
      (btn, idx) => idx !== currentIndex && btn.text.toLowerCase() === text.toLowerCase()
    );
  };

  // Check if button types are mixed
  const areButtonTypesMixed = (): boolean => {
    const hasQuickReply = buttons.some((btn) => btn.type === 'QUICK_REPLY');
    const hasCTA = buttons.some((btn) => btn.type === 'URL' || btn.type === 'PHONE_NUMBER');
    return hasQuickReply && hasCTA;
  };

  // Get button type counts
  const getButtonTypeCounts = () => {
    const quickReplyCount = buttons.filter((btn) => btn.type === 'QUICK_REPLY').length;
    const ctaCount = buttons.filter((btn) => btn.type === 'URL' || btn.type === 'PHONE_NUMBER').length;
    return { quickReplyCount, ctaCount };
  };

  // Handle add button
  const handleAddButton = () => {
    // Determine default button type based on existing buttons
    let defaultType: ButtonType = 'QUICK_REPLY';
    if (buttons.length > 0) {
      // Use the same type as existing buttons to avoid mixing
      const firstButton = buttons[0];
      defaultType = firstButton.type;
    }

    const newButton: TemplateButton = {
      type: defaultType,
      text: '',
    };

    if (defaultType === 'URL') {
      newButton.url = '';
    } else if (defaultType === 'PHONE_NUMBER') {
      newButton.phoneNumber = '';
    }

    updateButtons([...buttons, newButton]);
    setExpandedButtonIndex(buttons.length);
  };

  // Handle remove button
  const handleRemoveButton = (index: number) => {
    const updatedButtons = buttons.filter((_, i) => i !== index);
    updateButtons(updatedButtons.length > 0 ? updatedButtons : undefined);
    
    // Adjust expanded index
    if (expandedButtonIndex === index) {
      setExpandedButtonIndex(updatedButtons.length > 0 ? 0 : null);
    } else if (expandedButtonIndex !== null && expandedButtonIndex > index) {
      setExpandedButtonIndex(expandedButtonIndex - 1);
    }
  };

  // Handle button update
  const handleUpdateButton = (index: number, updates: Partial<TemplateButton>) => {
    const updatedButtons = buttons.map((btn, i) => {
      if (i === index) {
        const updatedButton = { ...btn, ...updates };
        
        // Clear URL/phone when type changes
        if (updates.type) {
          if (updates.type === 'QUICK_REPLY') {
            delete updatedButton.url;
            delete updatedButton.phoneNumber;
          } else if (updates.type === 'URL') {
            delete updatedButton.phoneNumber;
            if (!updatedButton.url) {
              updatedButton.url = '';
            }
          } else if (updates.type === 'PHONE_NUMBER') {
            delete updatedButton.url;
            if (!updatedButton.phoneNumber) {
              updatedButton.phoneNumber = '';
            }
          }
        }
        
        return updatedButton;
      }
      return btn;
    });

    updateButtons(updatedButtons);
  };

  // Get button type icon
  const getButtonTypeIcon = (type: ButtonType) => {
    switch (type) {
      case 'QUICK_REPLY':
        return <MousePointerClick className="h-4 w-4" />;
      case 'URL':
        return <ExternalLink className="h-4 w-4" />;
      case 'PHONE_NUMBER':
        return <Phone className="h-4 w-4" />;
    }
  };

  // Get button type label
  const getButtonTypeLabel = (type: ButtonType) => {
    switch (type) {
      case 'QUICK_REPLY':
        return 'Quick Reply';
      case 'URL':
        return 'URL';
      case 'PHONE_NUMBER':
        return 'Phone Number';
    }
  };

  // Check if can add more buttons
  const buttonTypeCounts = getButtonTypeCounts();
  const { quickReplyCount, ctaCount } = buttonTypeCounts;
  const canAddQuickReply = quickReplyCount < MAX_QUICK_REPLY_BUTTONS;
  const canAddCTA = ctaCount < MAX_CTA_BUTTONS;
  const canAddButton = buttons.length === 0 || 
    (buttons[0].type === 'QUICK_REPLY' && canAddQuickReply) ||
    ((buttons[0].type === 'URL' || buttons[0].type === 'PHONE_NUMBER') && canAddCTA);

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
          <label className="flex items-center text-sm font-medium text-gray-700">
            Buttons
            <Tooltip content="Add interactive buttons to your template. Choose between Quick Reply buttons or Call-To-Action buttons (URL/Phone).">
              <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
            </Tooltip>
          </label>
        </div>

        {/* Button Count Display */}
        {buttons.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            {buttons[0].type === 'QUICK_REPLY' ? (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 font-medium">
                {quickReplyCount}/{MAX_QUICK_REPLY_BUTTONS} Quick Reply
              </span>
            ) : (
              <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700 font-medium">
                {ctaCount}/{MAX_CTA_BUTTONS} Call-To-Action
              </span>
            )}
          </div>
        )}
      </div>

      {/* Buttons List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {buttons.map((button, index) => {
            const isExpanded = expandedButtonIndex === index;
            const textError = validateButtonText(button.text);
            const urlError = button.type === 'URL' ? validateUrl(button.url || '') : null;
            const phoneError = button.type === 'PHONE_NUMBER' ? validatePhoneNumber(button.phoneNumber || '') : null;
            const isDuplicate = hasDuplicateText(button.text, index);
            const hasError = !!textError || !!urlError || !!phoneError || isDuplicate;

            return (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`rounded-lg border ${
                  hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Button Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => setExpandedButtonIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {getButtonTypeIcon(button.type)}
                      <span className="text-xs font-medium text-gray-600">
                        {getButtonTypeLabel(button.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {button.text ? (
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {button.text}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No text set</p>
                      )}
                    </div>
                    {hasError && (
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveButton(index);
                    }}
                    className="ml-2 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Button Configuration (Expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 p-4 space-y-4 bg-white"
                    >
                      {/* Button Type Selector */}
                      <div>
                        <label className="mb-2 flex items-center text-xs font-medium text-gray-700">
                          Button Type
                          <span className="ml-1 text-red-500">*</span>
                        </label>
                        <Select
                          value={button.type}
                          onChange={(e) =>
                            handleUpdateButton(index, { type: e.target.value as ButtonType })
                          }
                          options={[
                            { value: 'QUICK_REPLY', label: 'Quick Reply' },
                            { value: 'URL', label: 'URL' },
                            { value: 'PHONE_NUMBER', label: 'Phone Number' },
                          ]}
                          disabled={buttons.length > 1} // Prevent mixing types
                        />
                        {buttons.length > 1 && (
                          <p className="mt-1 text-xs text-gray-500">
                            Cannot change type when multiple buttons exist
                          </p>
                        )}
                      </div>

                      {/* Button Text */}
                      <div>
                        <label className="mb-2 flex items-center text-xs font-medium text-gray-700">
                          Button Text
                          <span className="ml-1 text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={button.text}
                          onChange={(e) =>
                            handleUpdateButton(index, { text: e.target.value })
                          }
                          placeholder="e.g., Confirm Order"
                          maxLength={MAX_BUTTON_TEXT_LENGTH}
                          className={textError || isDuplicate ? 'border-red-500' : ''}
                        />
                        <div className="mt-1 flex justify-between text-xs">
                          <span className={button.text.length > MAX_BUTTON_TEXT_LENGTH ? 'text-red-600' : 'text-gray-500'}>
                            {button.text.length}/{MAX_BUTTON_TEXT_LENGTH} characters
                          </span>
                        </div>
                        {textError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {textError}
                          </p>
                        )}
                        {isDuplicate && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Duplicate button text. Each button must have unique text.
                          </p>
                        )}
                      </div>

                      {/* URL Input (for URL buttons) */}
                      {button.type === 'URL' && (
                        <div>
                          <label className="mb-2 flex items-center text-xs font-medium text-gray-700">
                            URL
                            <span className="ml-1 text-red-500">*</span>
                            <Tooltip content="Enter the URL. You can use {{1}} for one dynamic parameter.">
                              <Info className="ml-2 h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </Tooltip>
                          </label>
                          <Input
                            type="url"
                            value={button.url || ''}
                            onChange={(e) =>
                              handleUpdateButton(index, { url: e.target.value })
                            }
                            placeholder="https://example.com/order/{{1}}"
                            className={urlError ? 'border-red-500' : ''}
                          />
                          {urlError && (
                            <p className="mt-1 text-xs text-red-600 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {urlError}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            You can use {'{{1}}'} for one dynamic URL parameter
                          </p>
                        </div>
                      )}

                      {/* Phone Number Input (for Phone buttons) */}
                      {button.type === 'PHONE_NUMBER' && (
                        <div>
                          <label className="mb-2 flex items-center text-xs font-medium text-gray-700">
                            Phone Number
                            <span className="ml-1 text-red-500">*</span>
                            <Tooltip content="Enter phone number in E.164 format (e.g., +1234567890)">
                              <Info className="ml-2 h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </Tooltip>
                          </label>
                          <Input
                            type="tel"
                            value={button.phoneNumber || ''}
                            onChange={(e) =>
                              handleUpdateButton(index, { phoneNumber: e.target.value })
                            }
                            placeholder="+1234567890"
                            className={phoneError ? 'border-red-500' : ''}
                          />
                          {phoneError && (
                            <p className="mt-1 text-xs text-red-600 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {phoneError}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Must be in E.164 format: +[country code][number]
                          </p>
                        </div>
                      )}

                      {/* Button Type Info */}
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">
                          {button.type === 'QUICK_REPLY' && (
                            <>
                              <strong>Quick Reply:</strong> Sends a predefined text response when clicked.
                              Great for simple confirmations or menu options.
                            </>
                          )}
                          {button.type === 'URL' && (
                            <>
                              <strong>URL Button:</strong> Opens a website when clicked.
                              Perfect for order tracking, product pages, or external resources.
                            </>
                          )}
                          {button.type === 'PHONE_NUMBER' && (
                            <>
                              <strong>Phone Button:</strong> Initiates a phone call when clicked.
                              Ideal for customer support or sales inquiries.
                            </>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Button */}
        {buttons.length < (buttons.length > 0 && buttons[0].type === 'QUICK_REPLY' ? MAX_QUICK_REPLY_BUTTONS : MAX_CTA_BUTTONS) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddButton}
            disabled={!canAddButton}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Button
          </Button>
        )}

        {/* No Buttons State */}
        {buttons.length === 0 && (
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                <MousePointerClick className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">
              No Buttons Added
            </h4>
            <p className="text-xs text-gray-600 mb-4">
              Buttons are optional but can make your messages more interactive
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddButton}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Button
            </Button>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {buttonsError && (
        <div className="flex items-start space-x-2 rounded-lg bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{buttonsError.message}</p>
        </div>
      )}

      {/* Mixed Button Types Warning */}
      {areButtonTypesMixed() && (
        <div className="flex items-start space-x-2 rounded-lg bg-amber-50 p-3 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-900">
              Mixed Button Types Detected
            </p>
            <p className="mt-1 text-xs text-amber-700">
              You cannot mix Quick Reply buttons with Call-To-Action buttons (URL/Phone) in the same template.
            </p>
          </div>
        </div>
      )}

      {/* Button Limits Info */}
      {buttons.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            Button Limits
          </p>
          <ul className="space-y-1 text-xs text-blue-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Quick Reply buttons: Maximum {MAX_QUICK_REPLY_BUTTONS} buttons
                {buttons[0].type === 'QUICK_REPLY' && ` (${quickReplyCount}/${MAX_QUICK_REPLY_BUTTONS} used)`}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Call-To-Action buttons: Maximum {MAX_CTA_BUTTONS} buttons
                {(buttons[0].type === 'URL' || buttons[0].type === 'PHONE_NUMBER') && ` (${ctaCount}/${MAX_CTA_BUTTONS} used)`}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Cannot mix Quick Reply with Call-To-Action buttons</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Each button text must be unique (max {MAX_BUTTON_TEXT_LENGTH} characters)</span>
            </li>
          </ul>
        </div>
      )}

      {/* Guidelines */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Button Best Practices
        </p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Use clear, action-oriented text (e.g., "Confirm Order", "Call Support")</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Keep button text short and concise (max 25 characters)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Quick Reply buttons are best for simple yes/no or menu selections</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>URL buttons are ideal for directing users to web pages or tracking links</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Phone buttons make it easy for customers to contact you directly</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default ButtonEditor;
