import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { webhooksService } from '@/services/webhooks.service';
import { Webhook } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from '@/lib/toast';

interface WebhookDeleteModalProps {
  webhook: Webhook;
  onClose: () => void;
}

export function WebhookDeleteModal({ webhook, onClose }: WebhookDeleteModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => webhooksService.deleteWebhook(webhook.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete webhook');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Delete Webhook" size="sm">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the webhook <strong>{webhook.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. All webhook logs will also be deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Webhook'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
