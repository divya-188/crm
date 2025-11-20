import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, X } from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from '@/lib/toast';

export interface TemplateDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

/**
 * Template Duplication Modal
 * 
 * Features:
 * - Confirmation dialog for template duplication
 * - Optional custom name input with auto-generated suffix
 * - Copies all components and settings
 * - Resets status to draft
 * - Shows preview of what will be duplicated
 * 
 * Requirements: 14.6 - Template duplication logic
 */
export function TemplateDuplicateModal({ isOpen, onClose, template }: TemplateDuplicateModalProps) {
  const queryClient = useQueryClient();
  const [customName, setCustomName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);

  const duplicateMutation = useMutation({
    mutationFn: (data: { id: string; newName?: string }) => 
      templatesService.duplicateTemplate(data.id, data.newName),
    onSuccess: (duplicatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success(`Template duplicated as "${duplicatedTemplate.name}"`);
      onClose();
      // Reset state
      setCustomName('');
      setUseCustomName(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate template');
    },
  });

  const handleDuplicate = () => {
    if (template) {
      const newName = useCustomName && customName.trim() ? customName.trim() : undefined;
      duplicateMutation.mutate({ id: template.id, newName });
    }
  };

  const handleClose = () => {
    if (!duplicateMutation.isPending) {
      setCustomName('');
      setUseCustomName(false);
      onClose();
    }
  };

  // Generate suggested name
  const suggestedName = template ? `${template.name}_copy` : '';

  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Copy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Duplicate Template
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={duplicateMutation.isPending}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Original Template
              </p>
              <p className="text-base font-semibold text-neutral-900 dark:text-white">
                {template.name}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">Category</p>
                <p className="font-medium text-neutral-900 dark:text-white capitalize">
                  {template.category}
                </p>
              </div>
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">Language</p>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {template.language}
                </p>
              </div>
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">Status</p>
                <p className="font-medium text-neutral-900 dark:text-white capitalize">
                  {template.status}
                </p>
              </div>
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">Variables</p>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {template.variables?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              This will create a copy of the template with:
            </p>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>All components and settings copied</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Status reset to <strong className="text-neutral-900 dark:text-white">draft</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>New unique name with "_copy" suffix</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>All variables and buttons preserved</span>
              </li>
            </ul>
          </div>

          {/* Custom Name Option */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use-custom-name"
                checked={useCustomName}
                onChange={(e) => setUseCustomName(e.target.checked)}
                disabled={duplicateMutation.isPending}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label
                htmlFor="use-custom-name"
                className="ml-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Use custom name
              </label>
            </div>

            {useCustomName && (
              <div className="space-y-2">
                <Input
                  label="New Template Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={suggestedName}
                  disabled={duplicateMutation.isPending}
                  helperText="Leave empty to use auto-generated name with '_copy' suffix"
                />
                {customName.trim() && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    New name: <strong className="text-neutral-900 dark:text-white">{customName.trim()}</strong>
                  </p>
                )}
              </div>
            )}

            {!useCustomName && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Auto-generated name: <strong className="text-neutral-900 dark:text-white">{suggestedName}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={duplicateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDuplicate}
            loading={duplicateMutation.isPending}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
