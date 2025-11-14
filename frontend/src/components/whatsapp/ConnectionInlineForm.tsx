import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, Smartphone, Cloud, X, Settings as SettingsIcon } from 'lucide-react';
import { whatsappService, CreateConnectionDto, WhatsAppConnection } from '../../services/whatsapp.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface ConnectionInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  connection?: WhatsAppConnection | null;
  mode?: 'create' | 'edit';
}

const ConnectionInlineForm: React.FC<ConnectionInlineFormProps> = ({ 
  onSuccess, 
  onCancel, 
  connection = null,
  mode = 'create'
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!connection;

  const [formData, setFormData] = useState<CreateConnectionDto>({
    name: '',
    type: 'baileys',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
  });

  // Populate form data when editing
  useEffect(() => {
    if (connection && isEditMode) {
      setFormData({
        name: connection.name || '',
        type: connection.type || 'baileys',
        phoneNumberId: connection.phoneNumberId || '',
        businessAccountId: connection.businessAccountId || '',
        accessToken: '',
      });
    }
  }, [connection, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: CreateConnectionDto) => whatsappService.createConnection(data),
    onSuccess: () => {
      toast.success('WhatsApp connection created successfully');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create connection');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateConnectionDto>) => 
      whatsappService.updateConnection(connection!.id, data),
    onSuccess: () => {
      toast.success('WhatsApp connection updated successfully');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update connection');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Connection name is required');
      return;
    }

    if (formData.type === 'meta_api') {
      if (!formData.phoneNumberId?.trim()) {
        toast.error('Phone Number ID is required for Meta API connections');
        return;
      }
      if (!isEditMode && !formData.accessToken?.trim()) {
        toast.error('Access Token is required for Meta API connections');
        return;
      }
    }

    if (isEditMode) {
      const updateData: Partial<CreateConnectionDto> = {
        name: formData.name,
      };
      
      if (formData.type === 'meta_api') {
        updateData.phoneNumberId = formData.phoneNumberId;
        updateData.businessAccountId = formData.businessAccountId;
        if (formData.accessToken) {
          updateData.accessToken = formData.accessToken;
        }
      }
      
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof CreateConnectionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit WhatsApp Connection' : 'Create New Connection'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Update connection information' : 'Connect your WhatsApp Business account'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary-600" />
            Basic Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Connection Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
              placeholder="e.g., Main Business Number"
              required
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Connection Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChange('type', 'baileys')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'baileys'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                  <div className="font-medium text-sm text-neutral-900 dark:text-white">QR Code</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
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
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Cloud className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
                  <div className="font-medium text-sm text-neutral-900 dark:text-white">Meta API</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Business API
                  </div>
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Meta API Fields */}
        <AnimatePresence>
          {formData.type === 'meta_api' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5"
            >
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary-600" />
                Meta Business API Configuration
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Phone Number ID *
                </label>
                <Input
                  value={formData.phoneNumberId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange('phoneNumberId', e.target.value)
                  }
                  placeholder="Enter Phone Number ID"
                  required={formData.type === 'meta_api'}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Found in Meta Business Manager
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Business Account ID (Optional)
                </label>
                <Input
                  value={formData.businessAccountId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange('businessAccountId', e.target.value)
                  }
                  placeholder="Enter Business Account ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Access Token {!isEditMode && '*'}
                </label>
                <Input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange('accessToken', e.target.value)
                  }
                  placeholder={isEditMode ? 'Leave blank to keep current token' : 'Enter Access Token'}
                  required={!isEditMode && formData.type === 'meta_api'}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {isEditMode 
                    ? 'Only enter a new token if you want to update it'
                    : 'Generate from Meta Developer Portal'
                  }
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Baileys Info */}
        <AnimatePresence>
          {formData.type === 'baileys' && !isEditMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4"
            >
              <p className="text-sm text-primary-900 dark:text-primary-100">
                After creating the connection, you'll receive a QR code to scan with your
                WhatsApp mobile app.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Connection' : 'Create Connection'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ConnectionInlineForm;
