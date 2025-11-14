import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Cloud } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import toast from '../../lib/toast';
import { whatsappService, CreateConnectionDto } from '../../services/whatsapp.service';

interface ConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConnectionFormModal: React.FC<ConnectionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateConnectionDto>({
    name: '',
    type: 'baileys',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await whatsappService.createConnection(formData);
      toast.success('WhatsApp connection created successfully');
      onSuccess();
      onClose();
      setFormData({
        name: '',
        type: 'baileys',
        phoneNumberId: '',
        businessAccountId: '',
        accessToken: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateConnectionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add WhatsApp Connection">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Connection Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Connection Name
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Main Business Number"
            required
          />
        </div>

        {/* Connection Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Connection Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange('type', 'baileys')}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.type === 'baileys'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <div className="font-medium text-sm">QR Code</div>
              <div className="text-xs text-neutral-500 mt-1">
                Scan with WhatsApp
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange('type', 'meta_api')}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.type === 'meta_api'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <Cloud className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
              <div className="font-medium text-sm">Meta API</div>
              <div className="text-xs text-neutral-500 mt-1">
                Business API
              </div>
            </motion.button>
          </div>
        </div>

        {/* Meta API Fields */}
        <AnimatePresence>
          {formData.type === 'meta_api' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number ID
                </label>
                <Input
                  type="text"
                  value={formData.phoneNumberId}
                  onChange={(e) => handleChange('phoneNumberId', e.target.value)}
                  placeholder="Enter Phone Number ID"
                  required={formData.type === 'meta_api'}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Found in Meta Business Manager
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Business Account ID
                </label>
                <Input
                  type="text"
                  value={formData.businessAccountId}
                  onChange={(e) => handleChange('businessAccountId', e.target.value)}
                  placeholder="Enter Business Account ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Access Token
                </label>
                <Input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => handleChange('accessToken', e.target.value)}
                  placeholder="Enter Access Token"
                  required={formData.type === 'meta_api'}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Generate from Meta Developer Portal
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Baileys Info */}
        <AnimatePresence>
          {formData.type === 'baileys' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary-50 border border-primary-200 rounded-lg p-4"
            >
              <p className="text-sm text-primary-900">
                After creating the connection, you'll receive a QR code to scan with your
                WhatsApp mobile app.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Connection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
