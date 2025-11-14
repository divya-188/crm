import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from '@/lib/toast';

export interface TemplateDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export function TemplateDeleteModal({ isOpen, onClose, template }: TemplateDeleteModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    },
  });

  const handleDelete = () => {
    if (template) {
      deleteMutation.mutate(template.id);
    }
  };

  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete Template</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the template <strong>"{template.name}"</strong>?
          </p>
          <p className="text-sm text-gray-600">
            This action cannot be undone. The template will be permanently removed from your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
