import { useState, useEffect, useCallback } from 'react';
import { Template, Contact } from '@/types/models.types';
import { VariableMapping } from '@/components/templates/messaging';

interface UseTemplateVariableMappingProps {
  template?: Template;
  contact?: Contact;
}

interface ValidationError {
  variable: string;
  message: string;
}

export const useTemplateVariableMapping = ({
  template,
  contact,
}: UseTemplateVariableMappingProps) => {
  const [mapping, setMapping] = useState<VariableMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);

  // Initialize mapping when template changes
  useEffect(() => {
    if (template?.variables && template.variables.length > 0) {
      const initialMapping: VariableMapping = {};
      template.variables.forEach((variable) => {
        initialMapping[variable.name] = {
          source: 'contact_field',
          field: undefined,
          value: variable.example,
        };
      });
      setMapping(initialMapping);
    } else {
      setMapping({});
    }
  }, [template?.id]);

  // Validate mapping
  const validateMapping = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!template?.variables) return errors;

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
  }, [template, mapping, contact]);

  // Validate whenever mapping changes
  useEffect(() => {
    const errors = validateMapping();
    setValidationErrors(errors);
    setIsValid(errors.length === 0);
  }, [validateMapping]);

  const getContactFieldValue = (contact: Contact, field: string): any => {
    if (field.startsWith('customFields.')) {
      const customFieldKey = field.replace('customFields.', '');
      return contact.customFields?.[customFieldKey];
    }
    return (contact as any)[field];
  };

  const getVariableValues = useCallback((): Record<string, string> => {
    const values: Record<string, string> = {};

    Object.entries(mapping).forEach(([variableName, varMapping]) => {
      if (varMapping.source === 'custom_value' && varMapping.value) {
        values[variableName] = varMapping.value;
      } else if (varMapping.source === 'contact_field' && varMapping.field && contact) {
        const fieldValue = getContactFieldValue(contact, varMapping.field);
        values[variableName] = fieldValue?.toString() || '';
      }
    });

    return values;
  }, [mapping, contact]);

  const renderPreview = useCallback((): string => {
    if (!template) return '';

    let preview = template.content;
    const values = getVariableValues();

    if (template.variables) {
      template.variables.forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
        const value = values[variable.name] || `{{${variable.name}}}`;
        preview = preview.replace(regex, value);
      });
    }

    return preview;
  }, [template, getVariableValues]);

  const updateMapping = useCallback((variableName: string, update: Partial<VariableMapping[string]>) => {
    setMapping((prev) => ({
      ...prev,
      [variableName]: {
        ...prev[variableName],
        ...update,
      },
    }));
  }, []);

  const resetMapping = useCallback(() => {
    if (template?.variables && template.variables.length > 0) {
      const initialMapping: VariableMapping = {};
      template.variables.forEach((variable) => {
        initialMapping[variable.name] = {
          source: 'contact_field',
          field: undefined,
          value: variable.example,
        };
      });
      setMapping(initialMapping);
    } else {
      setMapping({});
    }
  }, [template]);

  return {
    mapping,
    setMapping,
    updateMapping,
    resetMapping,
    validationErrors,
    isValid,
    getVariableValues,
    renderPreview,
  };
};
