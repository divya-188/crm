import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Save,
  Loader2,
  X,
  FileText,
  Globe,
  Tag,
  Type,
  Image as ImageIcon,
  Video,
  FileIcon,
  Plus,
  Trash2,
  Link as LinkIcon,
  Phone,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Toast from '@/lib/toast-system';
import { WhatsAppPreview } from './wizard/preview/WhatsAppPreview';

interface TemplateInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  template?: Template | null;
  mode?: 'create' | 'edit';
}

interface FormData {
  name: string;
  displayName: string;
  category: string;
  language: string;
  description: string;
  header: {
    type: 'none' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    mediaUrl?: string;
  };
  body: string;
  footer: string;
  buttons: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
  variables: Record<string, string>;
}

const TemplateInlineForm: React.FC<TemplateInlineFormProps> = ({
  onSuccess,
  onCancel,
  template = null,
  mode = 'create',
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!template;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    category: '',
    language: '',
    description: '',
    header: { type: 'none' },
    body: '',
    footer: '',
    buttons: [],
    variables: {},
  });

  const [buttonType, setButtonType] = useState<'none' | 'cta' | 'quick_reply'>('none');

  // Populate form data when editing
  useEffect(() => {
    if (template && isEditMode) {
      const buttons = template.components?.buttons || template.buttons || [];
      const detectedButtonType =
        buttons.length === 0
          ? 'none'
          : buttons[0]?.type === 'QUICK_REPLY'
          ? 'quick_reply'
          : 'cta';

      setFormData({
        name: template.name || '',
        displayName: template.displayName || '',
        category: template.category || '',
        language: template.language || '',
        description: template.description || '',
        header: template.components?.header || { type: 'none' },
        body: template.components?.body?.text || template.content || '',
        footer: template.components?.footer?.text || template.footer || '',
        buttons: buttons,
        variables: template.sampleValues || {},
      });
      setButtonType(detectedButtonType);
    }
  }, [template, isEditMode]);

  // Auto-detect placeholders and update variables
  useEffect(() => {
    const placeholders = formData.body.match(/\{\{\d+\}\}/g) || [];
    const newVariables: Record<string, string> = {};
    
    placeholders.forEach((placeholder) => {
      const index = placeholder.match(/\d+/)?.[0];
      if (index) {
        newVariables[index] = formData.variables[index] || '';
      }
    });

    if (JSON.stringify(Object.keys(newVariables).sort()) !== JSON.stringify(Object.keys(formData.variables).sort())) {
      setFormData((prev) => ({ ...prev, variables: newVariables }));
    }
  }, [formData.body]);

  const createMutation = useMutation({
    mutationFn: (data: any) => templatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => templatesService.updateTemplate(template!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      Toast.error('Template name is required');
      return;
    }
    if (!formData.category) {
      Toast.error('Category is required');
      return;
    }
    if (!formData.language) {
      Toast.error('Language is required');
      return;
    }
    if (!formData.body.trim()) {
      Toast.error('Message body is required');
      return;
    }

    // Check if all placeholders have sample values
    const placeholders = formData.body.match(/\{\{\d+\}\}/g) || [];
    const missingVariables = placeholders.filter((p) => {
      const index = p.match(/\d+/)?.[0];
      return index && !formData.variables[index]?.trim();
    });

    if (missingVariables.length > 0) {
      Toast.error('Please provide sample values for all placeholders');
      return;
    }

    // Transform to API format
    const apiData = {
      name: formData.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: formData.displayName || formData.name,
      category: formData.category,
      language: formData.language,
      description: formData.description,
      components: {
        header: formData.header.type !== 'none' ? formData.header : undefined,
        body: {
          text: formData.body,
          placeholders: Object.entries(formData.variables).map(([index, example]) => ({
            index: parseInt(index),
            example,
          })),
        },
        footer: formData.footer ? { text: formData.footer } : undefined,
        buttons: formData.buttons.length > 0 ? formData.buttons : undefined,
      },
      sampleValues: formData.variables,
    };

    if (isEditMode) {
      updateMutation.mutate(apiData);
    } else {
      createMutation.mutate(apiData);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHeaderChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const addButton = () => {
    const maxButtons = buttonType === 'quick_reply' ? 3 : 2;
    if (formData.buttons.length >= maxButtons) {
      Toast.error(`Maximum ${maxButtons} buttons allowed for ${buttonType === 'quick_reply' ? 'Quick Reply' : 'Call-to-Action'}`);
      return;
    }

    const newButton = {
      type: buttonType === 'quick_reply' ? 'QUICK_REPLY' : 'URL',
      text: '',
      url: buttonType === 'cta' ? '' : undefined,
      phoneNumber: undefined,
    } as any;

    setFormData((prev) => ({
      ...prev,
      buttons: [...prev.buttons, newButton],
    }));
  };

  const removeButton = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  const updateButton = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) =>
        i === index ? { ...btn, [field]: value } : btn
      ),
    }));
  };

  const handleButtonTypeChange = (type: 'none' | 'cta' | 'quick_reply') => {
    setButtonType(type);
    setFormData((prev) => ({ ...prev, buttons: [] }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Auto-convert name to lowercase with underscores
  const handleNameChange = (value: string) => {
    const converted = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    handleChange('name', converted);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {isEditMode ? 'Edit Template' : 'Create New Template'}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {isEditMode ? 'Update template details and content' : 'Build your WhatsApp message template'}
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
              <Tag className="w-5 h-5 text-primary-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Template Name *
                  <span className="text-xs text-neutral-500 ml-2">(lowercase_with_underscores)</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                  placeholder="e.g., order_confirmation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Display Name
                </label>
                <Input
                  value={formData.displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('displayName', e.target.value)}
                  placeholder="e.g., Order Confirmation"
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
                    { value: '', label: 'Select category' },
                    { value: 'TRANSACTIONAL', label: 'Transactional' },
                    { value: 'UTILITY', label: 'Utility' },
                    { value: 'MARKETING', label: 'Marketing' },
                    { value: 'ACCOUNT_UPDATE', label: 'Account Update' },
                    { value: 'OTP', label: 'One-Time Password' },
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
                    { value: '', label: 'Select language' },
                    { value: 'en_US', label: 'English (US)' },
                    { value: 'en_GB', label: 'English (UK)' },
                    { value: 'es_ES', label: 'Spanish (Spain)' },
                    { value: 'pt_BR', label: 'Portuguese (Brazil)' },
                    { value: 'hi_IN', label: 'Hindi (India)' },
                    { value: 'ar', label: 'Arabic' },
                    { value: 'fr_FR', label: 'French (France)' },
                    { value: 'de_DE', label: 'German (Germany)' },
                  ]}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                  placeholder="Describe the purpose of this template..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Header Section */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Header (Optional)
            </h3>
            <div className="space-y-4">
              <Select
                value={formData.header.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleHeaderChange('type', e.target.value)}
                options={[
                  { value: 'none', label: 'No Header' },
                  { value: 'TEXT', label: 'Text Header' },
                  { value: 'IMAGE', label: 'Image Header' },
                  { value: 'VIDEO', label: 'Video Header' },
                  { value: 'DOCUMENT', label: 'Document Header' },
                ]}
              />
              {formData.header.type === 'TEXT' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Header Text (max 60 characters)
                  </label>
                  <Input
                    value={formData.header.text || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleHeaderChange('text', e.target.value)}
                    placeholder="Enter header text"
                    maxLength={60}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {(formData.header.text || '').length}/60 characters
                  </p>
                </div>
              )}
              {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.header.type) && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Media URL
                  </label>
                  <Input
                    value={formData.header.mediaUrl || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleHeaderChange('mediaUrl', e.target.value)}
                    placeholder="https://example.com/media.jpg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-primary-600" />
              Message Body *
            </h3>
            <div>
              <Textarea
                value={formData.body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('body', e.target.value)}
                placeholder="Enter your message. Use {{1}}, {{2}}, etc. for variables"
                rows={6}
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.body.length}/1024 characters • Use {`{{1}}, {{2}}`} for placeholders
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Footer (Optional)
            </h3>
            <div>
              <Input
                value={formData.footer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('footer', e.target.value)}
                placeholder="e.g., Reply STOP to unsubscribe"
                maxLength={60}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.footer.length}/60 characters
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-primary-600" />
              Buttons (Optional)
            </h3>
            <div className="space-y-4">
              <Select
                value={buttonType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleButtonTypeChange(e.target.value as any)}
                options={[
                  { value: 'none', label: 'No Buttons' },
                  { value: 'cta', label: 'Call-to-Action (max 2)' },
                  { value: 'quick_reply', label: 'Quick Reply (max 3)' },
                ]}
              />

              {buttonType !== 'none' && (
                <div className="space-y-3">
                  {formData.buttons.map((button, index) => (
                    <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        {buttonType === 'cta' && (
                          <Select
                            value={button.type}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateButton(index, 'type', e.target.value)}
                            className="w-40"
                            options={[
                              { value: 'URL', label: 'URL' },
                              { value: 'PHONE_NUMBER', label: 'Phone' },
                            ]}
                          />
                        )}
                        <Input
                          value={button.text}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateButton(index, 'text', e.target.value)}
                          placeholder="Button text (max 20 chars)"
                          maxLength={20}
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
                      {button.type === 'URL' && (
                        <Input
                          value={button.url || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateButton(index, 'url', e.target.value)}
                          placeholder="https://example.com"
                          type="url"
                        />
                      )}
                      {button.type === 'PHONE_NUMBER' && (
                        <Input
                          value={button.phoneNumber || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateButton(index, 'phoneNumber', e.target.value)}
                          placeholder="+1234567890"
                          type="tel"
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addButton}
                    disabled={formData.buttons.length >= (buttonType === 'quick_reply' ? 3 : 2)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Variables */}
          {Object.keys(formData.variables).length > 0 && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                Sample Values *
              </h3>
              <div className="space-y-3">
                {Object.keys(formData.variables)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-16 text-center">
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {`{{${key}}}`}
                        </span>
                      </div>
                      <Input
                        value={formData.variables[key]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev) => ({
                            ...prev,
                            variables: { ...prev.variables, [key]: e.target.value },
                          }))
                        }
                        placeholder="Enter sample value"
                        required
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

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

      {/* Preview Section */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <WhatsAppPreview data={formData} />
        </div>
      </div>
    </div>
  );
};

export default TemplateInlineForm;
