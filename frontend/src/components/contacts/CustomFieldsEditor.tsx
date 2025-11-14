import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { contactsService } from '@/services/contacts.service';
import { CustomFieldDefinition, CustomFieldType } from '@/types/models.types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';

interface CustomFieldsEditorProps {
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({
  values,
  onChange,
  errors = {},
}) => {
  // Fetch custom field definitions
  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ['customFieldDefinitions', false],
    queryFn: () => contactsService.getCustomFieldDefinitions(false),
  });

  const handleFieldChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (customFields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No custom fields defined yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {customFields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>

          {/* Text Field */}
          {field.type === CustomFieldType.TEXT && (
            <Input
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.isRequired}
            />
          )}

          {/* Number Field */}
          {field.type === CustomFieldType.NUMBER && (
            <Input
              type="number"
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.isRequired}
            />
          )}

          {/* Date Field */}
          {field.type === CustomFieldType.DATE && (
            <Input
              type="date"
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.isRequired}
            />
          )}

          {/* Dropdown Field */}
          {field.type === CustomFieldType.DROPDOWN && (
            <Select
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              options={[
                { value: '', label: `Select ${field.label.toLowerCase()}` },
                ...(field.options || []).map((option) => ({
                  value: option,
                  label: option,
                })),
              ]}
              required={field.isRequired}
            />
          )}

          {/* Checkbox Field */}
          {field.type === CustomFieldType.CHECKBOX && (
            <Checkbox
              checked={values[field.key] === true || values[field.key] === 'true'}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              label={field.helpText || field.label}
            />
          )}

          {/* Help Text */}
          {field.helpText && field.type !== CustomFieldType.CHECKBOX && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
          )}

          {/* Error Message */}
          {errors[field.key] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[field.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
};
