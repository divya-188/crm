import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { contactsService } from '@/services/contacts.service';
import {
  CustomFieldDefinition,
  CustomFieldType,
  CreateCustomFieldDefinitionDto,
  UpdateCustomFieldDefinitionDto,
} from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import toast from 'react-hot-toast';

interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  field?: CustomFieldDefinition | null;
}

export const CustomFieldModal: React.FC<CustomFieldModalProps> = ({
  isOpen,
  onClose,
  field,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!field;

  const [formData, setFormData] = useState<CreateCustomFieldDefinitionDto>({
    key: '',
    label: '',
    type: CustomFieldType.TEXT,
    options: [],
    isRequired: false,
    defaultValue: '',
    placeholder: '',
    helpText: '',
    sortOrder: 0,
  });

  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (field) {
      setFormData({
        key: field.key,
        label: field.label,
        type: field.type,
        options: field.options || [],
        isRequired: field.isRequired,
        defaultValue: field.defaultValue || '',
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        sortOrder: field.sortOrder,
      });
      setDropdownOptions(field.options || []);
    } else {
      setFormData({
        key: '',
        label: '',
        type: CustomFieldType.TEXT,
        options: [],
        isRequired: false,
        defaultValue: '',
        placeholder: '',
        helpText: '',
        sortOrder: 0,
      });
      setDropdownOptions([]);
    }
  }, [field, isOpen]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCustomFieldDefinitionDto) =>
      contactsService.createCustomFieldDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFieldDefinitions'] });
      toast.success('Custom field created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create custom field');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomFieldDefinitionDto) =>
      contactsService.updateCustomFieldDefinition(field!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFieldDefinitions'] });
      toast.success('Custom field updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update custom field');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate key format
    if (!isEditing && !/^[a-z0-9_]+$/.test(formData.key)) {
      toast.error('Key must be lowercase alphanumeric with underscores only');
      return;
    }

    // Validate dropdown options
    if (formData.type === CustomFieldType.DROPDOWN && dropdownOptions.length === 0) {
      toast.error('Dropdown type requires at least one option');
      return;
    }

    const submitData = {
      ...formData,
      options: formData.type === CustomFieldType.DROPDOWN ? dropdownOptions : undefined,
    };

    if (isEditing) {
      const { key, ...updateData } = submitData;
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleLabelChange = (label: string) => {
    setFormData({ ...formData, label });
    
    // Auto-generate key from label if not editing
    if (!isEditing) {
      const key = label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      setFormData(prev => ({ ...prev, key }));
    }
  };

  const handleAddOption = () => {
    if (newOption.trim() && !dropdownOptions.includes(newOption.trim())) {
      setDropdownOptions([...dropdownOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== index));
  };

  const fieldTypeOptions = [
    { value: CustomFieldType.TEXT, label: 'Text' },
    { value: CustomFieldType.NUMBER, label: 'Number' },
    { value: CustomFieldType.DATE, label: 'Date' },
    { value: CustomFieldType.DROPDOWN, label: 'Dropdown' },
    { value: CustomFieldType.CHECKBOX, label: 'Checkbox' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Custom Field' : 'Create Custom Field'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Label <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g., Customer Type"
            required
            maxLength={100}
          />
        </div>

        {/* Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Key <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="e.g., customer_type"
            required
            disabled={isEditing}
            maxLength={50}
            pattern="[a-z0-9_]+"
            title="Lowercase alphanumeric with underscores only"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Unique identifier (lowercase, alphanumeric, underscores only)
          </p>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Field Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomFieldType })}
            options={fieldTypeOptions}
            required
          />
        </div>

        {/* Dropdown Options */}
        {formData.type === CustomFieldType.DROPDOWN && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add an option"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddOption} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {dropdownOptions.length > 0 && (
                <div className="space-y-1">
                  {dropdownOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Placeholder
          </label>
          <Input
            value={formData.placeholder}
            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
            placeholder="e.g., Enter customer type"
          />
        </div>

        {/* Help Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Help Text
          </label>
          <Textarea
            value={formData.helpText}
            onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
            placeholder="Additional information about this field"
            rows={2}
          />
        </div>

        {/* Default Value */}
        {formData.type !== CustomFieldType.CHECKBOX && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Value
            </label>
            {formData.type === CustomFieldType.DROPDOWN ? (
              <Select
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                options={[
                  { value: '', label: 'None' },
                  ...dropdownOptions.map(opt => ({ value: opt, label: opt })),
                ]}
              />
            ) : (
              <Input
                type={formData.type === CustomFieldType.NUMBER ? 'number' : formData.type === CustomFieldType.DATE ? 'date' : 'text'}
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                placeholder="Default value"
              />
            )}
          </div>
        )}

        {/* Is Required */}
        <div>
          <Checkbox
            checked={formData.isRequired}
            onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
            label="Required field"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Update' : 'Create'} Custom Field
          </Button>
        </div>
      </form>
    </Modal>
  );
};
