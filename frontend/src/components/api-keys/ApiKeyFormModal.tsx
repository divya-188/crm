import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Info } from 'lucide-react';
import { apiKeysService } from '@/services/api-keys.service';
import { ApiKey, CreateApiKeyDto } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import toast from '@/lib/toast';

interface ApiKeyFormModalProps {
  apiKey: ApiKey | null;
  onClose: () => void;
}

const AVAILABLE_RESOURCES = [
  { key: 'contacts', label: 'Contacts', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'messages', label: 'Messages', actions: ['send', 'read'] },
  { key: 'conversations', label: 'Conversations', actions: ['read', 'update'] },
  { key: 'templates', label: 'Templates', actions: ['read', 'send'] },
  { key: 'campaigns', label: 'Campaigns', actions: ['read', 'create', 'update'] },
  { key: 'webhooks', label: 'Webhooks', actions: ['trigger'] },
];

export function ApiKeyFormModal({ apiKey, onClose }: ApiKeyFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateApiKeyDto>({
    name: '',
    rateLimit: 100,
    rateLimitWindow: 60,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Set<string>>>({});
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    if (apiKey) {
      setFormData({
        name: apiKey.name,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        rateLimitWindow: apiKey.rateLimitWindow,
        expiresAt: apiKey.expiresAt,
      });

      // Parse permissions
      const perms: Record<string, Set<string>> = {};
      Object.entries(apiKey.permissions).forEach(([resource, actions]) => {
        if (Array.isArray(actions)) {
          perms[resource] = new Set(actions);
        } else if (actions === '*') {
          const resourceDef = AVAILABLE_RESOURCES.find((r) => r.key === resource);
          perms[resource] = new Set(resourceDef?.actions || ['*']);
        }
      });
      setSelectedPermissions(perms);

      if (apiKey.expiresAt) {
        setExpirationEnabled(true);
        setExpirationDate(new Date(apiKey.expiresAt).toISOString().split('T')[0]);
      }
    }
  }, [apiKey]);

  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyDto) => apiKeysService.createApiKey(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      // Store the created key data for the display modal
      queryClient.setQueryData(['new-api-key'], {
        message: 'API key created successfully. Save this key securely as it will not be shown again.',
        apiKey: data,
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create API key');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateApiKeyDto) =>
      apiKeysService.updateApiKey(apiKey!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key updated successfully');
      onClose();
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

    // Build permissions object
    const permissions: Record<string, any> = {};
    Object.entries(selectedPermissions).forEach(([resource, actions]) => {
      if (actions.size > 0) {
        const resourceDef = AVAILABLE_RESOURCES.find((r) => r.key === resource);
        if (resourceDef && actions.size === resourceDef.actions.length) {
          permissions[resource] = '*';
        } else {
          permissions[resource] = Array.from(actions);
        }
      }
    });

    const submitData: CreateApiKeyDto = {
      ...formData,
      ...(Object.keys(permissions).length > 0 && { permissions }),
      ...(expirationEnabled && expirationDate && { expiresAt: new Date(expirationDate).toISOString() }),
    };

    if (apiKey) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handlePermissionToggle = (resource: string, action: string) => {
    const newPerms = { ...selectedPermissions };
    if (!newPerms[resource]) {
      newPerms[resource] = new Set();
    }

    if (newPerms[resource].has(action)) {
      newPerms[resource].delete(action);
    } else {
      newPerms[resource].add(action);
    }

    setSelectedPermissions(newPerms);
  };

  const handleSelectAllForResource = (resource: string) => {
    const resourceDef = AVAILABLE_RESOURCES.find((r) => r.key === resource);
    if (!resourceDef) return;

    const newPerms = { ...selectedPermissions };
    const currentPerms = newPerms[resource] || new Set();

    if (currentPerms.size === resourceDef.actions.length) {
      newPerms[resource] = new Set();
    } else {
      newPerms[resource] = new Set(resourceDef.actions);
    }

    setSelectedPermissions(newPerms);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={apiKey ? 'Edit API Key' : 'Create API Key'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Production API Key"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A descriptive name to identify this API key
          </p>
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permissions (Optional)
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
            {AVAILABLE_RESOURCES.map((resource) => {
              const resourcePerms = selectedPermissions[resource.key] || new Set();
              const allSelected = resourcePerms.size === resource.actions.length;

              return (
                <div key={resource.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={allSelected}
                        onChange={() => handleSelectAllForResource(resource.key)}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {resource.label}
                      </span>
                    </label>
                    {resourcePerms.size > 0 && !allSelected && (
                      <span className="text-xs text-gray-500">
                        {resourcePerms.size} of {resource.actions.length}
                      </span>
                    )}
                  </div>

                  <div className="ml-6 space-y-1">
                    {resource.actions.map((action) => (
                      <label
                        key={action}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                      >
                        <Checkbox
                          checked={resourcePerms.has(action)}
                          onChange={() => handlePermissionToggle(resource.key, action)}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              If no permissions are specified, the API key will have access to all resources and actions.
            </p>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate Limit
            </label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={formData.rateLimit}
              onChange={(e) =>
                setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 100 })
              }
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maximum requests allowed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Window (seconds)
            </label>
            <Input
              type="number"
              min="1"
              max="3600"
              value={formData.rateLimitWindow}
              onChange={(e) =>
                setFormData({ ...formData, rateLimitWindow: parseInt(e.target.value) || 60 })
              }
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Time window for rate limit
            </p>
          </div>
        </div>

        {/* Expiration */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <Checkbox
              checked={expirationEnabled}
              onChange={(e) => setExpirationEnabled(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Set expiration date
            </span>
          </label>

          {expirationEnabled && (
            <div className="relative">
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : apiKey
              ? 'Update API Key'
              : 'Create API Key'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
