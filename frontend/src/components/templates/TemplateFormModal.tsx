import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, Info } from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template, CreateTemplateDto, TemplateVariable, TemplateButton } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import toast from '@/lib/toast';

export interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: Template | null;
}

export function TemplateFormModal({ isOpen, onClose, template }: TemplateFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!template;

  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: '',
    category: 'utility',
    language: 'en',
    content: '',
    header: '',
    footer: '',
    variables: [],
    buttons: [],
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        category: template.category,
        language: template.language,
        content: template.content,
        header: template.header || '',
        footer: template.footer || '',
        variables: template.variables || [],
        buttons: template.buttons || [],
      });
    } else {
      setFormData({
        name: '',
        category: 'utility',
        language: 'en',
        content: '',
        header: '',
        footer: '',
        variables: [],
        buttons: [],
      });
    }
  }, [template, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateDto) => templatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTemplateDto) =>
      templatesService.updateTemplate(template!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate variables match placeholders
    const placeholders = formData.content.match(/\{\{\d+\}\}/g) || [];
    if (placeholders.length !== (formData.variables?.length || 0)) {
      toast.error(`Template has ${placeholders.length} placeholders but ${formData.variables?.length || 0} variables`);
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [...(formData.variables || []), { name: '', example: '' }],
    });
  };

  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      variables: formData.variables?.filter((_, i) => i !== index),
    });
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: string) => {
    const newVariables = [...(formData.variables || [])];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setFormData({ ...formData, variables: newVariables });
  };

  const addButton = () => {
    if ((formData.buttons?.length || 0) >= 3) {
      toast.error('Maximum 3 buttons allowed');
      return;
    }
    setFormData({
      ...formData,
      buttons: [...(formData.buttons || []), { type: 'url', text: '', url: '' }],
    });
  };

  const removeButton = (index: number) => {
    setFormData({
      ...formData,
      buttons: formData.buttons?.filter((_, i) => i !== index),
    });
  };

  const updateButton = (index: number, field: keyof TemplateButton, value: string) => {
    const newButtons = [...(formData.buttons || [])];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setFormData({ ...formData, buttons: newButtons });
  };

  const insertPlaceholder = () => {
    const nextIndex = (formData.variables?.length || 0) + 1;
    setFormData({
      ...formData,
      content: formData.content + `{{${nextIndex}}}`,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., welcome_message"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <Select
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value as any })}
                required
                options={[
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'utility', label: 'Utility' },
                  { value: 'authentication', label: 'Authentication' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language *
              </label>
              <Select
                value={formData.language}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, language: e.target.value })}
                required
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'en_US', label: 'English (US)' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'ar', label: 'Arabic' },
                  { value: 'hi', label: 'Hindi' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Header (Optional)
            </label>
            <Input
              value={formData.header}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, header: e.target.value })}
              placeholder="Header text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Content *
            </label>
            <div className="space-y-2">
              <Textarea
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your message. Use {{1}}, {{2}}, etc. for variables"
                rows={6}
                required
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Info className="w-4 h-4" />
                  <span>Use {`{{1}}, {{2}}`}, etc. for variables</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={insertPlaceholder}
                >
                  Insert Placeholder
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Footer (Optional)
            </label>
            <Input
              value={formData.footer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, footer: e.target.value })}
              placeholder="Footer text"
            />
          </div>
        </div>

        {/* Variables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Variables
            </label>
            <Button type="button" size="sm" variant="outline" onClick={addVariable} icon={<Plus className="w-4 h-4" />}>
              Add Variable
            </Button>
          </div>

          {formData.variables && formData.variables.length > 0 && (
            <div className="space-y-3">
              {formData.variables.map((variable, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-sm font-medium text-gray-600">{`{{${index + 1}}}`}</span>
                  </div>
                  <Input
                    value={variable.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariable(index, 'name', e.target.value)}
                    placeholder="Variable name"
                    required
                  />
                  <Input
                    value={variable.example}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariable(index, 'example', e.target.value)}
                    placeholder="Example value"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeVariable(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Buttons (Max 3)
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addButton}
              icon={<Plus className="w-4 h-4" />}
              disabled={(formData.buttons?.length || 0) >= 3}
            >
              Add Button
            </Button>
          </div>

          {formData.buttons && formData.buttons.length > 0 && (
            <div className="space-y-3">
              {formData.buttons.map((button, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <Select
                      value={button.type}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateButton(index, 'type', e.target.value)}
                      className="w-40"
                      options={[
                        { value: 'url', label: 'URL' },
                        { value: 'phone', label: 'Phone' },
                        { value: 'quick_reply', label: 'Quick Reply' },
                      ]}
                    />
                    <Input
                      value={button.text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateButton(index, 'text', e.target.value)}
                      placeholder="Button text"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeButton(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {button.type === 'url' && (
                    <Input
                      value={button.url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateButton(index, 'url', e.target.value)}
                      placeholder="https://example.com"
                      type="url"
                    />
                  )}
                  {button.type === 'phone' && (
                    <Input
                      value={button.phoneNumber || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateButton(index, 'phoneNumber', e.target.value)}
                      placeholder="+1234567890"
                      type="tel"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
