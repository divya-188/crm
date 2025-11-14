import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { tenantsService, Tenant } from '../../services/tenants.service';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface TenantDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onSuccess: () => void;
}

const TenantDeleteModal: React.FC<TenantDeleteModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState('');

  const deleteMutation = useMutation({
    mutationFn: () => tenantsService.delete(tenant.id),
    onSuccess: () => {
      toast.success('Tenant deleted successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete tenant');
    },
  });

  const handleDelete = () => {
    if (confirmText !== tenant.name) {
      toast.error('Please type the tenant name correctly to confirm');
      return;
    }

    deleteMutation.mutate();
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Delete Tenant
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800 rounded-lg">
          <p className="text-sm text-danger-800 dark:text-danger-200">
            <strong>Warning:</strong> Deleting this tenant will permanently remove all associated
            data including:
          </p>
          <ul className="mt-2 ml-4 text-sm text-danger-700 dark:text-danger-300 list-disc space-y-1">
            <li>All users and agents</li>
            <li>All contacts and conversations</li>
            <li>All campaigns and templates</li>
            <li>All chatbot flows and automations</li>
            <li>All analytics and reports</li>
          </ul>
        </div>

        {/* Tenant Info */}
        <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            You are about to delete:
          </p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">
            {tenant.name}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{tenant.slug}</p>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Type <span className="font-bold">{tenant.name}</span> to confirm deletion
          </label>
          <Input
            value={confirmText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmText(e.target.value)}
            placeholder={tenant.name}
            autoComplete="off"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || confirmText !== tenant.name}
            className="flex items-center gap-2"
          >
            {deleteMutation.isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Tenant
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TenantDeleteModal;
