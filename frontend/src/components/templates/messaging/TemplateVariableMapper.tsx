import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Hash,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { Template, Contact } from '@/types/models.types';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';

interface TemplateVariableMapperProps {
  template: Template;
  contact?: Contact;
  onMappingChange: (mapping: VariableMapping) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  showPreview?: boolean;
}

export interface VariableMapping {
  [variableName: string]: {
    source: 'contact_field' | 'custom_value';
    field?: string; // Contact field name
    value?: string; // Custom value
  };
}

interface ValidationError {
  variable: string;
  message: string;
}

const CONTACT_FIELD_OPTIONS = [
  { value: 'firstName', label: 'First Name', icon: User },
  { value: 'lastName', label: 'Last Name', icon: User },
  { value: 'name', label: 'Full Name', icon: User },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone Number', icon: Phone },
  { value: 'phoneNumber', label: 'Phone Number (Alt)', icon: Phone },
];

export const TemplateVariableMapper: React.FC<TemplateVariableMapperProps> = ({
  template,
  contact,
  onMappingChange,
  onValidationChange,
  showPreview = true,
}) => {
  const [mapping, setMapping] = useState<VariableMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreviewPanel, setShowPreviewPanel] = useState(showPreview);
  const [customFieldKeys, setCustomFieldKeys] = useState<string[]>([]);

  // Extract custom field keys from contact
  useEffect(() => {
    if (contact?.customFields) {
      setCustomFieldKeys(Object.keys(contact.customFields));
    }
  }, [contact]);

  // Initialize mapping with default values
  useEffect(() => {
    if (template.variables && template.variables.length > 0) {
      const initialMapping: VariableMapping = {};
      template.variables.forEach((variable) => {
        initialMapping[variable.name] = {
          source: 'contact_field',
          field: undefined,
          value: variable.example,
        };
      });
      setMapping(initialMapping);
    }
  }, [template.variables]);

  // Validate mapping whenever it changes
  useEffect(() => {
    const errors = validateMapping();
    setValidationErrors(errors);
    
    const isValid = errors.length === 0;
    onValidationChange?.(isValid, errors.map(e => e.message));
  }, [mapping, template.variables]);

  // Notify parent of mapping changes
  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  const validateMapping = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!template.variables) return errors;

    template.variables.forEach((variable) => {
      const varMapping = mapping[variable.name];

      if (!varMapping) {
        errors.push({
          variable: variable.name,
          message: `Variable {{${variable.name}}} is not mapped`,
        });
        return;
      }

      if (varMapping.source === 'contact_field') {
        if (!varMapping.field) {
          errors.push({
            variable: variable.name,
            message: `No contact field selected for {{${variable.name}}}`,
          });
        } else if (contact) {
          // Check if the contact has this field and it's not empty
          const fieldValue = getContactFieldValue(contact, varMapping.field);
          if (!fieldValue || fieldValue.toString().trim() === '') {
            errors.push({
              variable: variable.name,
              message: `Contact field "${varMapping.field}" is empty`,
            });
          }
        }
      } else if (varMapping.source === 'custom_value') {
        if (!varMapping.value || varMapping.value.trim() === '') {
          errors.push({
            variable: variable.name,
            message: `Custom value for {{${variable.name}}} is empty`,
          });
        }
      }
    });

    return errors;
  };

  const getContactFieldValue = (contact: Contact, field: string): any => {
    if (field.startsWith('customFields.')) {
      const customFieldKey = field.replace('customFields.', '');
      return contact.customFields?.[customFieldKey];
    }
    return (contact as any)[field];
  };

  const handleSourceChange = (variableName: string, source: 'contact_field' | 'custom_value') => {
    setMapping((prev) => ({
      ...prev,
      [variableName]: {
        ...prev[variableName],
        source,
        field: source === 'contact_field' ? undefined : prev[variableName]?.field,
        value: source === 'custom_value' ? prev[variableName]?.value || '' : undefined,
      },
    }));
  };

  const handleFieldChange = (variableName: string, field: string) => {
    setMapping((prev) => ({
      ...prev,
      [variableName]: {
        ...prev[variableName],
        field,
      },
    }));
  };

  const handleValueChange = (variableName: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [variableName]: {
        ...prev[variableName],
        value,
      },
    }));
  };

  const getPreviewValue = (variableName: string): string => {
    const varMapping = mapping[variableName];
    if (!varMapping) return `{{${variableName}}}`;

    if (varMapping.source === 'contact_field' && varMapping.field) {
      if (contact) {
        const value = getContactFieldValue(contact, varMapping.field);
        return value?.toString() || `[${varMapping.field}]`;
      }
      return `[${varMapping.field}]`;
    } else if (varMapping.source === 'custom_value' && varMapping.value) {
      return varMapping.value;
    }

    return `{{${variableName}}}`;
  };

  const renderPreview = (): string => {
    let preview = template.content;
    
    if (template.variables) {
      template.variables.forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
        preview = preview.replace(regex, getPreviewValue(variable.name));
      });
    }

    return preview;
  };

  if (!template.variables || template.variables.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Info className="w-5 h-5" />
          <p className="text-sm">This template has no variables to map.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Variable Mapping
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Map template variables to contact fields or provide custom values
          </p>
        </div>
        {showPreview && (
          <button
            onClick={() => setShowPreviewPanel(!showPreviewPanel)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {showPreviewPanel ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Preview
              </>
            )}
          </button>
        )}
      </div>

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                {validationErrors.length} {validationErrors.length === 1 ? 'Error' : 'Errors'} Found
              </h4>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Variable Mapping Cards */}
      <div className="space-y-3">
        {template.variables.map((variable, index) => {
          const varMapping = mapping[variable.name];
          const hasError = validationErrors.some(e => e.variable === variable.name);

          return (
            <motion.div
              key={variable.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'p-4 transition-all',
                  hasError && 'border-red-300 dark:border-red-700'
                )}
              >
                <div className="space-y-4">
                  {/* Variable Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {`{{${variable.name}}}`}
                        </Badge>
                        {!hasError && varMapping && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {hasError && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Example: {variable.example}
                      </p>
                    </div>
                  </div>

                  {/* Source Selection */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSourceChange(variable.name, 'contact_field')}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                        varMapping?.source === 'contact_field'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      Contact Field
                    </button>
                    <button
                      onClick={() => handleSourceChange(variable.name, 'custom_value')}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                        varMapping?.source === 'custom_value'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <Hash className="w-4 h-4 inline mr-2" />
                      Custom Value
                    </button>
                  </div>

                  {/* Field/Value Input */}
                  <AnimatePresence mode="wait">
                    {varMapping?.source === 'contact_field' && (
                      <motion.div
                        key="contact-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Select
                          value={varMapping.field || ''}
                          onChange={(e) => handleFieldChange(variable.name, e.target.value)}
                          options={[
                            { value: '', label: 'Select contact field...' },
                            ...CONTACT_FIELD_OPTIONS.map(opt => ({
                              value: opt.value,
                              label: opt.label,
                            })),
                            ...customFieldKeys.map(key => ({
                              value: `customFields.${key}`,
                              label: `Custom: ${key}`,
                            })),
                          ]}
                        />
                        {contact && varMapping.field && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Current value: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {getContactFieldValue(contact, varMapping.field)?.toString() || '(empty)'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {varMapping?.source === 'custom_value' && (
                      <motion.div
                        key="custom-value"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Input
                          placeholder={`Enter value for {{${variable.name}}}`}
                          value={varMapping.value || ''}
                          onChange={(e) => handleValueChange(variable.name, e.target.value)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreviewPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Message Preview
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {renderPreview()}
                    </p>
                  </div>
                  {contact && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Preview for: {contact.name || contact.firstName || contact.phone}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State */}
      {validationErrors.length === 0 && template.variables.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              All variables are properly mapped and ready to send
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
