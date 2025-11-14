import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Loader2, FileText, X, Plus, Trash2, Info } from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template, CreateTemplateDto, TemplateVariable, TemplateButton } from '@/types/models.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import toast from 'react-hot-toast';

interface TemplateInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  template?: Template | null;
  mode?: 'create' | 'edit';
}

const TemplateInlineForm: React.FC<TemplateInlineFormProps> = ({ 
  onSuccess, 
  onCancel, 
  template = null,
  mode = 'create'
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!template;

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

  // Populate form data when editing
  useEffect(() => {
    if (template && isEditMode) {
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
    }
  }, [template, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateDto) => templatesService.createTemplate(data),
    onSuccess: () => {
      toast.success('Template created successfully');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTemplateDto) =>
      templatesService.updateTemplate(template!.id, data),
    onSuccess: () => {
      toast.success('Template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Template content is required');
      return;
    }

    // Validate variables match placeholders
    const placeholders = formData.content.match(/\{\{\d+\}\}/g) || [];
    if (placeholders.length !== (formData.variables?.length || 0)) {
      toast.error(`Template has ${placeholders.length} placeholders but ${formData.variables?.length || 0} variables`);
      return;
    }

    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Update template information and content' : 'Create a new WhatsApp message template'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Template Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                placeholder="e.g., welcome_message"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Category *
              </label>
              <Select
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('category', e.target.value)}
                required
                options={[
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'utility', label: 'Utility' },
                  { value: 'authentication', label: 'Authentication' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Language *
              </label>
              <Select
                value={formData.language}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('language', e.target.value)}
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
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Header (Optional)
              </label>
              <Input
                value={formData.header}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('header', e.target.value)}
                placeholder="Header text"
              />
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Message Content
          </h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Message Content *
            </label>
            <div className="space-y-2">
              <Textarea
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('content', e.target.value)}
                placeholder="Enter your message. Use {{1}}, {{2}}, etc. for variables"
                rows={6}
                required
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Footer (Optional)
            </label>
            <Input
              value={formData.footer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('footer', e.target.value)}
              placeholder="Footer text"
            />
          </div>
        </div>

        {/* Variables */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Variables
            </h3>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={addVariable}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Variable
            </Button>
          </div>

          {formData.variables && formData.variables.length > 0 && (
            <div className="space-y-3">
              {formData.variables.map((variable, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{`{{${index + 1}}}`}</span>
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
                    className="text-danger-600 hover:text-danger-700 flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Buttons (Max 3)
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addButton}
              disabled={(formData.buttons?.length || 0) >= 3}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Button
            </Button>
          </div>

          {formData.buttons && formData.buttons.length > 0 && (
            <div className="space-y-3">
              {formData.buttons.map((button, index) => (
                <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-3">
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
                      className="text-danger-600 hover:text-danger-700 flex-shrink-0"
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
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Template' : 'Create Template'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default TemplateInlineForm;
