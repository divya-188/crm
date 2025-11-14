import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { apiKeysService } from '@/services/api-keys.service';
import { ApiKey } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import toast from '@/lib/toast';

interface ApiKeyDeleteModalProps {
  apiKey: ApiKey;
  onClose: () => void;
}

export function ApiKeyDeleteModal({ apiKey, onClose }: ApiKeyDeleteModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiKeysService.deleteApiKey(apiKey.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete API key');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Delete API Key"
      size="md"
    >
      <div className="space-y-6">
        <Alert 
          variant="danger"
          title="This action cannot be undone"
          message="Deleting this API key will immediately revoke access for any applications using it. This may cause service disruptions."
          icon={<AlertTriangle className="w-5 h-5" />}
        />

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {apiKey.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Key Prefix:</span>
            <span className="text-sm font-mono text-gray-900 dark:text-white">
              {apiKey.keyPrefix}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Requests:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {apiKey.totalRequests.toLocaleString()}
            </span>
          </div>
          {apiKey.lastUsedAt && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Last Used:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {new Date(apiKey.lastUsedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete API Key'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
