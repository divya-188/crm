import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  X,
  CheckCircle,
  Eye,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Template, TemplateCategory } from '@/types/models.types';
import { templatesService } from '@/services/templates.service';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
  selectedTemplateId?: string;
  category?: TemplateCategory;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  onClose,
  selectedTemplateId,
  category,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>(
    category || 'all'
  );
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Fetch approved templates only
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', 'approved', selectedCategory, searchQuery],
    queryFn: () =>
      templatesService.getTemplates({
        status: 'approved',
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        limit: 50,
      }),
  });

  const templates = templatesData?.data || [];

  const handleSelect = (template: Template) => {
    onSelect(template);
    onClose();
  };

  const getCategoryColor = (cat: TemplateCategory): string => {
    switch (cat) {
      case 'marketing':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'utility':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'authentication':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getVariableCount = (template: Template): number => {
    return template.variables?.length || 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute bottom-full left-0 right-0 mb-2 z-50"
    >
      <Card className="max-h-[500px] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Select Template
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {['all', 'marketing', 'utility', 'authentication'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as TemplateCategory | 'all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="max-h-[350px] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? 'No templates found matching your search'
                  : 'No approved templates available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    'p-3 rounded-lg border-2 cursor-pointer transition-all',
                    selectedTemplateId === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                  onClick={() => handleSelect(template)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {template.name}
                        </h4>
                        {selectedTemplateId === template.id && (
                          <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {template.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={getCategoryColor(template.category)}
                        >
                          {template.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {template.language}
                        </Badge>
                        {getVariableCount(template) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {getVariableCount(template)} variable
                            {getVariableCount(template) !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreview(
                          showPreview === template.id ? null : template.id
                        );
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Preview */}
                  <AnimatePresence>
                    {showPreview === template.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="bg-white dark:bg-gray-800 rounded p-3 text-sm">
                          {template.header && (
                            <div className="font-semibold mb-2 text-gray-900 dark:text-white">
                              {template.header}
                            </div>
                          )}
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {template.content}
                          </div>
                          {template.footer && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {template.footer}
                            </div>
                          )}
                          {template.buttons && template.buttons.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {template.buttons.map((button, idx) => (
                                <div
                                  key={idx}
                                  className="text-center py-2 border border-blue-500 text-blue-600 dark:text-blue-400 rounded text-sm"
                                >
                                  {button.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {templates.length} template{templates.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
