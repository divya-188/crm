import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from '../../lib/toast';
import { whatsappService, WhatsAppConnection } from '../../services/whatsapp.service';

interface ConnectionDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: WhatsAppConnection | null;
  onSuccess: () => void;
}

export const ConnectionDeleteModal: React.FC<ConnectionDeleteModalProps> = ({
  isOpen,
  onClose,
  connection,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!connection) return;

    setIsDeleting(true);
    try {
      await whatsappService.deleteConnection(connection.id);
      toast.success('Connection deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete connection');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!connection) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Connection">
      <div className="space-y-6">
        {/* Warning */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-danger-900 mb-1">
              Are you sure you want to delete this connection?
            </h4>
            <p className="text-sm text-danger-700">
              This action cannot be undone. All associated data and message history will be
              permanently removed.
            </p>
          </div>
        </motion.div>

        {/* Connection Details */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="space-y-2">
            <div>
              <span className="text-sm text-neutral-600">Connection Name:</span>
              <p className="font-medium text-neutral-900">{connection.name}</p>
            </div>
            {connection.phoneNumber && (
              <div>
                <span className="text-sm text-neutral-600">Phone Number:</span>
                <p className="font-medium text-neutral-900">{connection.phoneNumber}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-neutral-600">Type:</span>
              <p className="font-medium text-neutral-900">
                {connection.type === 'meta_api' ? 'Meta API' : 'QR Code'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Connection'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
