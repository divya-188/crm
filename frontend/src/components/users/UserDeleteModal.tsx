import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { AlertTriangle } from 'lucide-react';
import { usersService } from '@/services/users.service';
import { User } from '@/types/models.types';
import Toast from '@/lib/toast-system';

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserDeleteModal = ({ isOpen, onClose, user }: UserDeleteModalProps) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Toast.success('User deleted successfully');
      onClose();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleDelete = () => {
    if (user) {
      deleteMutation.mutate(user.id);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete User" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to delete{' '}
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>{' '}
              ({user.email}). This action cannot be undone.
            </p>
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Deleting this user will remove all their data and access to the system.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
