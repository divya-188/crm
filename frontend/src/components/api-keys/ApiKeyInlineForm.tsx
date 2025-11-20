import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Key, Save, Loader2, X, Shield, Clock, Activity } from 'lucide-react';
import { apiKeysService } from '@/services/api-keys.service';
import { ApiKey, CreateApiKeyDto, UpdateApiKeyDto } from '@/types/models.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import toast from '@/lib/toast';

interface ApiKeyInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  apiKey?: ApiKey | null;
  mode?: 'create' | 'edit';
}

const ApiKeyInlineForm: React.FC<ApiKeyInlineFormProps> = ({
  onSuccess,
  onCancel,
  apiKey = null,
  mode = 'create',
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!apiKey;

  const [formData, setFormData] = useState<CreateApiKeyDto>({
    name: '',
    permissions: {},
    rateLimit: 1000,
    rateLimitWindow: 3600,
    expiresAt: undefined,
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDays, setExpiryDays] = useState(90);

  // Available permissions
  const availablePermissions = [
    { key: 'contacts.read', label: 'Read Contacts', category: 'Contacts' },
    { key: 'contacts.write', label: 'Write Contacts', category: 'Contacts' },
    { key: 'contacts.delete', label: 'Delete Contacts', category: 'Contacts' },
    { key: 'messages.read', label: 'Read Messages', category: 'Messages' },
    { key: 'messages.send', label: 'Send Messages', category: 'Messages' },
    { key: 'conversations.read', label: 'Read Conversations', category: 'Conversations' },
    { key: 'conversations.write', label: 'Write Conversations', category: 'Conversations' },
    { key: 'templates.read', label: 'Read Templates', category: 'Templates' },
    { key: 'templates.write', label: 'Write Templates', category: 'Templates' },
    { key: 'campaigns.read', label: 'Read Campaigns', category: 'Campaigns' },
    { key: 'campaigns.write', label: 'Write Campaigns', category: 'Campaigns' },
    { key: 'flows.read', label: 'Read Flows', category: 'Flows' },
    { key: 'flows.write', label: 'Write Flows', category: 'Flows' },
    { key: 'webhooks.read', label: 'Read Webhooks', category: 'Webhooks' },
    { key: 'webhooks.write', label: 'Write Webhooks', category: 'Webhooks' },
  ];

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof availablePermissions>);

  // Populate form data when editing
  useEffect(() => {
    if (apiKey && isEditMode) {
      setFormData({
        name: apiKey.name || '',
        permissions: apiKey.permissions || {},
        rateLimit: apiKey.rateLimit || 1000,
        rateLimitWindow: apiKey.rateLimitWindow || 3600,
        expiresAt: apiKey.expiresAt,
      });

      // Set selected permissions
      const perms = new Set<string>();
      if (apiKey.permissions) {
        Object.keys(apiKey.permissions).forEach((key) => {
          if (apiKey.permissions[key]) {
            perms.add(key);
          }
        });
      }
      setSelectedPermissions(perms);

      // Set expiry
      if (apiKey.expiresAt) {
        setExpiryEnabled(true);
        const daysUntilExpiry = Math.ceil(
          (new Date(apiKey.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        setExpiryDays(daysUntilExpiry > 0 ? daysUntilExpiry : 90);
      }
    }
  }, [apiKey, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyDto) => apiKeysService.createApiKey(data),
    onSuccess: (newApiKey) => {
      toast.success('API key created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      // Store the new API key temporarily so we can display it
      queryClient.setQueryData(['new-api-key'], {
        message: 'API key created successfully',
        apiKey: newApiKey,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create API key');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateApiKeyDto) =>
      apiKeysService.updateApiKey(apiKey!.id, data),
    onSuccess: () => {
      toast.success('API key updated successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update API key');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter an API key name');
      return;
    }

    if (selectedPermissions.size === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    // Build permissions object
    const permissions: Record<string, boolean> = {};
    selectedPermissions.forEach((perm) => {
      permissions[perm] = true;
    });

    // Calculate expiry date
    let expiresAt: string | undefined;
    if (expiryEnabled && expiryDays > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      expiresAt = expiryDate.toISOString();
    }

    const submitData: CreateApiKeyDto | UpdateApiKeyDto = {
      name: formData.name,
      permissions,
      rateLimit: formData.rateLimit,
      rateLimitWindow: formData.rateLimitWindow,
      expiresAt,
    };

    if (isEditMode) {
      updateMutation.mutate(submitData as UpdateApiKeyDto);
    } else {
      createMutation.mutate(submitData as CreateApiKeyDto);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permission: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permission)) {
      newSelected.delete(permission);
    } else {
      newSelected.add(permission);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAllInCategory = (category: string) => {
    const categoryPerms = groupedPermissions[category].map((p) => p.key);
    const allSelected = categoryPerms.every((p) => selectedPermissions.has(p));

    const newSelected = new Set(selectedPermissions);
    if (allSelected) {
      categoryPerms.forEach((p) => newSelected.delete(p));
    } else {
      categoryPerms.forEach((p) => newSelected.add(p));
    }
    setSelectedPermissions(newSelected);
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
            <Key className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit API Key' : 'Create New API Key'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode
                ? 'Update API key configuration and permissions'
                : 'Generate a new API key for programmatic access'}
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
        {/* Basic Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-600" />
            Basic Information
          </h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              API Key Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('name', e.target.value)
              }
              placeholder="e.g., Production API Key"
              required
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              A descriptive name to identify this API key
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Permissions *
          </h3>

          <div className="max-h-80 overflow-y-auto border border-neutral-300 dark:border-neutral-600 rounded-lg p-4 space-y-4 bg-neutral-50 dark:bg-neutral-800/50">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                    {category}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleSelectAllInCategory(category)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {permissions.every((p) => selectedPermissions.has(p.key))
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2 ml-2">
                  {permissions.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1.5 rounded transition-colors"
                    >
                      <Checkbox
                        checked={selectedPermissions.has(perm.key)}
                        onChange={() => handlePermissionToggle(perm.key)}
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rate Limiting */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Rate Limiting
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Rate Limit (requests)
              </label>
              <Input
                type="number"
                min="1"
                max="100000"
                value={formData.rateLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('rateLimit', parseInt(e.target.value))
                }
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Maximum requests allowed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Window (seconds)
              </label>
              <Input
                type="number"
                min="60"
                max="86400"
                value={formData.rateLimitWindow}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('rateLimitWindow', parseInt(e.target.value))
                }
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Time window for rate limit
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Current setting: {formData.rateLimit} requests per {formData.rateLimitWindow} seconds
          </p>
        </div>

        {/* Expiry */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Expiration
          </h3>

          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={expiryEnabled}
              onChange={(e) => setExpiryEnabled(e.target.checked)}
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Set expiration date
            </span>
          </label>

          {expiryEnabled && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Expires in (days)
              </label>
              <Input
                type="number"
                min="1"
                max="3650"
                value={expiryDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExpiryDays(parseInt(e.target.value))
                }
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                API key will expire on{' '}
                {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-purple-700 hover:to-purple-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update API Key' : 'Create API Key'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ApiKeyInlineForm;
