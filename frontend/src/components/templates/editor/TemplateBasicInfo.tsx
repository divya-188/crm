import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import { templatesService } from '@/services/templates.service';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Tooltip from '@/components/ui/Tooltip';

interface CategoryOption {
  code: string;
  name: string;
  description: string;
  examples: string[];
  approvalDifficulty: string;
  restrictions: string[];
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  popular: boolean;
}

/**
 * TemplateBasicInfo Component
 * 
 * Handles the basic information section of the template editor:
 * - Template name (lowercase with underscores)
 * - Display name (user-friendly)
 * - Category selection with descriptions
 * - Language selection
 * - Description textarea
 * 
 * Features:
 * - Real-time validation feedback
 * - Category descriptions and examples
 * - Language search and filtering
 * - Character count indicators
 */
export const TemplateBasicInfo: React.FC = () => {
  const {
    name,
    displayName,
    category,
    language,
    description,
    setBasicInfo,
    validationErrors,
  } = useTemplateEditorStore();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [languageSearch, setLanguageSearch] = useState('');

  // Load categories and languages on mount
  useEffect(() => {
    loadCategories();
    loadLanguages();
  }, []);

  // Update selected category when category changes
  useEffect(() => {
    const cat = categories.find((c) => c.code === category);
    setSelectedCategory(cat || null);
  }, [category, categories]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await templatesService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadLanguages = async () => {
    try {
      setIsLoadingLanguages(true);
      const response = await templatesService.getLanguages();
      setLanguages(response.languages);
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  // Validation helpers
  const getFieldError = (fieldName: string) => {
    return validationErrors.find((error) => error.field === fieldName);
  };

  const validateTemplateName = (value: string): string | null => {
    if (!value) {
      return 'Template name is required';
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      return 'Template name must be lowercase with underscores only (no spaces or special characters)';
    }
    if (value.length > 512) {
      return 'Template name must not exceed 512 characters';
    }
    return null;
  };

  // Event handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBasicInfo({ name: value });
    
    // Auto-generate display name if empty
    if (!displayName && value) {
      const generatedDisplayName = value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setBasicInfo({ displayName: generatedDisplayName });
    }
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBasicInfo({ displayName: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBasicInfo({ category: e.target.value });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBasicInfo({ language: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBasicInfo({ description: e.target.value });
  };

  // Filter languages based on search
  const filteredLanguages = languages.filter((lang) => {
    if (!languageSearch) return true;
    const search = languageSearch.toLowerCase();
    return (
      lang.name.toLowerCase().includes(search) ||
      lang.nativeName.toLowerCase().includes(search) ||
      lang.code.toLowerCase().includes(search)
    );
  });

  // Group languages: popular first, then alphabetically
  const popularLanguages = filteredLanguages.filter((lang) => lang.popular);
  const otherLanguages = filteredLanguages.filter((lang) => !lang.popular);

  const fieldError = getFieldError('name');
  const validationError = name ? validateTemplateName(name) : null;
  const nameError = fieldError?.message || validationError;
  const hasNameError = !!nameError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6"
    >
      {/* Template Name */}
      <div>
        <label htmlFor="template-name" className="mb-2 flex items-center text-sm font-medium text-gray-700">
          Template Name
          <span className="ml-1 text-red-500">*</span>
          <Tooltip content="Unique identifier for your template. Use lowercase letters, numbers, and underscores only.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </label>
        
        <Input
          id="template-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g., order_confirmation_v1"
          className={hasNameError ? 'border-red-500 focus:ring-red-500' : ''}
        />
        
        {/* Real-time validation feedback */}
        {name && (
          <div className="mt-2 flex items-start space-x-2">
            {hasNameError ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{nameError}</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600">Valid template name</p>
              </>
            )}
          </div>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          This will be used as the template identifier in Meta's system.
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="display-name" className="mb-2 flex items-center text-sm font-medium text-gray-700">
          Display Name
          <Tooltip content="A user-friendly name for your template that will be shown in the template list.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </label>
        
        <Input
          id="display-name"
          type="text"
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="e.g., Order Confirmation"
        />
        
        <p className="mt-1 text-xs text-gray-500">
          Optional. A friendly name to help you identify this template.
        </p>
      </div>

      {/* Category Selector */}
      <div>
        <label htmlFor="category" className="mb-2 flex items-center text-sm font-medium text-gray-700">
          Category
          <span className="ml-1 text-red-500">*</span>
          <Tooltip content="Select the category that best describes your template's purpose. This affects approval requirements.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </label>
        
        {isLoadingCategories ? (
          <div className="flex items-center space-x-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading categories...</span>
          </div>
        ) : (
          <Select
            id="category"
            value={category}
            onChange={handleCategoryChange}
            placeholder="Select a category"
            options={categories.map((cat) => ({
              value: cat.code,
              label: cat.name,
            }))}
          />
        )}

        {/* Category Description */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-lg bg-blue-50 p-4"
          >
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-blue-900">
                {selectedCategory.name}
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                {selectedCategory.description}
              </p>
            </div>

            {/* Approval Difficulty */}
            <div className="mt-3 flex items-center space-x-2">
              <span className="text-xs font-medium text-blue-800">Approval Difficulty:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  selectedCategory.approvalDifficulty === 'Easy'
                    ? 'bg-green-100 text-green-800'
                    : selectedCategory.approvalDifficulty === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {selectedCategory.approvalDifficulty}
              </span>
            </div>

            {/* Examples */}
            {selectedCategory.examples.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-blue-800 mb-1">Examples:</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedCategory.examples.map((example, index) => (
                    <li key={index} className="text-xs text-blue-700">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Restrictions */}
            {selectedCategory.restrictions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-blue-800 mb-1">Restrictions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedCategory.restrictions.map((restriction, index) => (
                    <li key={index} className="text-xs text-blue-700">
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Language Selector */}
      <div>
        <label htmlFor="language" className="mb-2 flex items-center text-sm font-medium text-gray-700">
          Language
          <span className="ml-1 text-red-500">*</span>
          <Tooltip content="Select the language for your template. You'll need to create separate templates for each language.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </label>
        
        {isLoadingLanguages ? (
          <div className="flex items-center space-x-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading languages...</span>
          </div>
        ) : (
          <>
            {/* Language Search */}
            <Input
              type="text"
              placeholder="Search languages..."
              value={languageSearch}
              onChange={(e) => setLanguageSearch(e.target.value)}
              className="mb-2"
            />

            <Select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              placeholder="Select a language"
              options={[
                ...popularLanguages.map((lang) => ({
                  value: lang.code,
                  label: `${lang.name} (${lang.nativeName}) - ${lang.code}`,
                })),
                ...otherLanguages.map((lang) => ({
                  value: lang.code,
                  label: `${lang.name} (${lang.nativeName}) - ${lang.code}`,
                })),
              ]}
            />
          </>
        )}

        {/* Selected Language Info */}
        {language && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>
              Selected: {languages.find((l) => l.code === language)?.name || language}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 flex items-center text-sm font-medium text-gray-700">
          Description
          <Tooltip content="Optional description to help you and your team understand the purpose of this template.">
            <Info className="ml-2 h-4 w-4 text-gray-400 cursor-help" />
          </Tooltip>
        </label>
        
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Describe the purpose and use case for this template..."
          rows={3}
          maxLength={500}
        />
        
        {/* Character count */}
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Optional. Helps organize and identify templates.</span>
          <span>{description.length}/500</span>
        </div>
      </div>

      {/* Summary Card */}
      {name && category && language && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900">
                Basic Information Complete
              </h4>
              <p className="mt-1 text-sm text-green-700">
                You can now proceed to configure the template components below.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TemplateBasicInfo;
