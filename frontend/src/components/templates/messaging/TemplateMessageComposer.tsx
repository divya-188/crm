import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Send,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Template, Contact } from '@/types/models.types';
import { TemplateSelector } from './TemplateSelector';
import { TemplateVariableMapper, VariableMapping } from './TemplateVariableMapper';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface TemplateMessageComposerProps {
  contact?: Contact;
  onSend: (templateId: string, variableValues: Record<string, string>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

type ComposerStep = 'select' | 'map' | 'confirm';

export const TemplateMessageComposer: React.FC<TemplateMessageComposerProps> = ({
  contact,
  onSend,
  onClose,
  isOpen,
}) => {
  const [currentStep, setCurrentStep] = useState<ComposerStep>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableMapping, setVariableMapping] = useState<VariableMapping>({});
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('select');
      setSelectedTemplate(null);
      setVariableMapping({});
      setIsValid(false);
      setValidationErrors([]);
      setIsSending(false);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    
    // If template has no variables, skip to confirm
    if (!template.variables || template.variables.length === 0) {
      setCurrentStep('confirm');
      setIsValid(true);
    } else {
      setCurrentStep('map');
    }
  };

  const handleBack = () => {
    if (currentStep === 'map') {
      setCurrentStep('select');
      setSelectedTemplate(null);
    } else if (currentStep === 'confirm') {
      if (selectedTemplate?.variables && selectedTemplate.variables.length > 0) {
        setCurrentStep('map');
      } else {
        setCurrentStep('select');
        setSelectedTemplate(null);
      }
    }
  };

  const handleMappingChange = (mapping: VariableMapping) => {
    setVariableMapping(mapping);
  };

  const handleValidationChange = (valid: boolean, errors: string[]) => {
    setIsValid(valid);
    setValidationErrors(errors);
  };

  const handleProceedToConfirm = () => {
    if (isValid) {
      setCurrentStep('confirm');
    }
  };

  const getVariableValues = (): Record<string, string> => {
    const values: Record<string, string> = {};

    Object.entries(variableMapping).forEach(([variableName, mapping]) => {
      if (mapping.source === 'custom_value' && mapping.value) {
        values[variableName] = mapping.value;
      } else if (mapping.source === 'contact_field' && mapping.field && contact) {
        const fieldValue = getContactFieldValue(contact, mapping.field);
        values[variableName] = fieldValue?.toString() || '';
      }
    });

    return values;
  };

  const getContactFieldValue = (contact: Contact, field: string): any => {
    if (field.startsWith('customFields.')) {
      const customFieldKey = field.replace('customFields.', '');
      return contact.customFields?.[customFieldKey];
    }
    return (contact as any)[field];
  };

  const renderPreviewWithValues = (): string => {
    if (!selectedTemplate) return '';

    let preview = selectedTemplate.content;
    const values = getVariableValues();

    if (selectedTemplate.variables) {
      selectedTemplate.variables.forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
        const value = values[variable.name] || `{{${variable.name}}}`;
        preview = preview.replace(regex, value);
      });
    }

    return preview;
  };

  const handleSend = async () => {
    if (!selectedTemplate || !isValid) return;

    setIsSending(true);
    try {
      const variableValues = getVariableValues();
      await onSend(selectedTemplate.id, variableValues);
      onClose();
    } catch (error) {
      console.error('Failed to send template message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentStep !== 'select' && (
                  <button
                    onClick={handleBack}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentStep === 'select' && 'Select Template'}
                    {currentStep === 'map' && 'Map Variables'}
                    {currentStep === 'confirm' && 'Confirm & Send'}
                  </h2>
                  {contact && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      Sending to: {contact.name || contact.firstName || contact.phone}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div
                className={cn(
                  'flex-1 h-1 rounded-full transition-all',
                  currentStep === 'select'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                )}
              />
              <div
                className={cn(
                  'flex-1 h-1 rounded-full transition-all',
                  currentStep === 'map'
                    ? 'bg-blue-500'
                    : currentStep === 'confirm'
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
              <div
                className={cn(
                  'flex-1 h-1 rounded-full transition-all',
                  currentStep === 'confirm'
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Template Selection */}
              {currentStep === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <TemplateSelector
                    onSelect={handleTemplateSelect}
                    onClose={onClose}
                    selectedTemplateId={selectedTemplate?.id}
                  />
                </motion.div>
              )}

              {/* Step 2: Variable Mapping */}
              {currentStep === 'map' && selectedTemplate && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <TemplateVariableMapper
                    template={selectedTemplate}
                    contact={contact}
                    onMappingChange={handleMappingChange}
                    onValidationChange={handleValidationChange}
                    showPreview={true}
                  />
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 'confirm' && selectedTemplate && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Ready to Send
                      </h3>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Review the message below before sending
                    </p>
                  </div>

                  {/* Template Info */}
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Template: {selectedTemplate.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Category: {selectedTemplate.category}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Language: {selectedTemplate.language}
                      </span>
                    </div>
                  </Card>

                  {/* Message Preview */}
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Message Preview
                    </h4>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                      {selectedTemplate.header && (
                        <div className="font-semibold text-gray-900 dark:text-white mb-2">
                          {selectedTemplate.header}
                        </div>
                      )}
                      <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {renderPreviewWithValues()}
                      </div>
                      {selectedTemplate.footer && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          {selectedTemplate.footer}
                        </div>
                      )}
                      {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {selectedTemplate.buttons.map((button, idx) => (
                            <div
                              key={idx}
                              className="text-center py-2 border-2 border-green-600 text-green-700 dark:text-green-300 rounded-lg font-medium"
                            >
                              {button.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Variable Values Summary */}
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Variable Values
                      </h4>
                      <div className="space-y-2">
                        {selectedTemplate.variables.map((variable) => {
                          const values = getVariableValues();
                          return (
                            <div
                              key={variable.name}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded"
                            >
                              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                {`{{${variable.name}}}`}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {values[variable.name] || '(empty)'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <div>
                {validationErrors.length > 0 && currentStep === 'map' && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''} to fix
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                {currentStep === 'map' && (
                  <Button
                    onClick={handleProceedToConfirm}
                    disabled={!isValid}
                  >
                    Continue
                  </Button>
                )}
                {currentStep === 'confirm' && (
                  <Button
                    onClick={handleSend}
                    disabled={!isValid || isSending}
                    className="min-w-[120px]"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
