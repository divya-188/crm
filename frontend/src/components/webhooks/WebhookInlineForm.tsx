import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Webhook as WebhookIcon, Save, Loader2, Settings as SettingsIcon, X, Eye, EyeOff } from 'lucide-react';
import { webhooksService } from '@/services/webhooks.service';
import { Webhook, CreateWebhookDto } from '@/types/models.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import toast from '@/lib/toast';

interface WebhookInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  webhook?: Webhook | null;
  mode?: 'create' | 'edit';
}

const WebhookInlineForm: React.FC<WebhookInlineFormProps> = ({
  onSuccess,
  onCancel,
  webhook = null,
  mode = 'create',
}) => {
  const isEditMode = mode === 'edit' || !!webhook;

  const [formData, setFormData] = useState<CreateWebhookDto>({
    name: '',
    url: '',
    events: [],
    secret: '',
    retryCount: 3,
    timeoutSeconds: 30,
    isActive: true,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  // Fetch available events
  const { data: availableEvents } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => webhooksService.getAvailableEvents(),
  });

  // Populate form data when editing
  useEffect(() => {
    if (webhook && isEditMode) {
      setFormData({
        name: webhook.name || '',
        url: webhook.url || '',
        events: webhook.events || [],
        secret: webhook.secret || '',
        retryCount: webhook.retryCount || 3,
        timeoutSeconds: webhook.timeoutSeconds || 30,
        isActive: webhook.isActive ?? true,
      });
      setSelectedEvents(new Set(webhook.events || []));
    }
  }, [webhook, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWebhookDto) => webhooksService.createWebhook(data),
    onSuccess: () => {
      toast.success('Webhook created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create webhook');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateWebhookDto) =>
      webhooksService.updateWebhook(webhook!.id, data),
    onSuccess: () => {
      toast.success('Webhook updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update webhook');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a webhook name');
      return;
    }

    if (!formData.url.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    if (selectedEvents.size === 0) {
      toast.error('Please select at least one event');
      return;
    }

    const submitData = {
      ...formData,
      events: Array.from(selectedEvents),
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventToggle = (event: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(event)) {
      newSelected.delete(event);
    } else {
      newSelected.add(event);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = () => {
    if (availableEvents) {
      if (selectedEvents.size === availableEvents.length) {
        setSelectedEvents(new Set());
      } else {
        setSelectedEvents(new Set(availableEvents));
      }
    }
  };

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setFormData({ ...formData, secret });
  };

  // Group events by category
  const groupedEvents = useMemo(() => {
    if (!availableEvents) return {};

    const groups: Record<string, string[]> = {
      Messages: [],
      Conversations: [],
      Contacts: [],
      Campaigns: [],
      Flows: [],
      Automations: [],
      Templates: [],
      Other: [],
    };

    availableEvents.forEach((event) => {
      if (event === '*') {
        groups.Other.push(event);
      } else if (event.startsWith('message.')) {
        groups.Messages.push(event);
      } else if (event.startsWith('conversation.')) {
        groups.Conversations.push(event);
      } else if (event.startsWith('contact.')) {
        groups.Contacts.push(event);
      } else if (event.startsWith('campaign.')) {
        groups.Campaigns.push(event);
      } else if (event.startsWith('flow.')) {
        groups.Flows.push(event);
      } else if (event.startsWith('automation.')) {
        groups.Automations.push(event);
      } else if (event.startsWith('template.')) {
        groups.Templates.push(event);
      } else {
        groups.Other.push(event);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [availableEvents]);

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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <WebhookIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit Webhook' : 'Create New Webhook'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode
                ? 'Update webhook configuration and event subscriptions'
                : 'Configure a new webhook to receive real-time event notifications'}
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
            <WebhookIcon className="w-5 h-5 text-blue-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Webhook Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('name', e.target.value)
                }
                placeholder="e.g., New Message Webhook"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Webhook URL *
              </label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('url', e.target.value)
                }
                placeholder="https://example.com/webhook"
                required
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            The URL where webhook events will be sent via HTTP POST
          </p>
        </div>

        {/* Events */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Events to Subscribe *
            </h3>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {selectedEvents.size === availableEvents?.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border border-neutral-300 dark:border-neutral-600 rounded-lg p-4 space-y-4 bg-neutral-50 dark:bg-neutral-800/50">
            {Object.entries(groupedEvents).map(([category, events]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  {category}
                </h4>
                <div className="space-y-2 ml-2">
                  {events.map((event) => (
                    <label
                      key={event}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1.5 rounded transition-colors"
                    >
                      <Checkbox
                        checked={selectedEvents.has(event)}
                        onChange={() => handleEventToggle(event)}
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {event}
                        {event === '*' && (
                          <span className="ml-2 text-xs text-neutral-500">(All events)</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Security & Configuration */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            Security & Configuration
          </h3>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Secret (Optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={formData.secret}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('secret', e.target.value)
                  }
                  placeholder="Leave empty to auto-generate"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button type="button" variant="secondary" onClick={generateSecret}>
                Generate
              </Button>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Used to verify webhook signatures (HMAC SHA-256)
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Retry Count
              </label>
              <Input
                type="number"
                min="0"
                max="10"
                value={formData.retryCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('retryCount', parseInt(e.target.value))
                }
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Number of retry attempts on failure
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                min="5"
                max="120"
                value={formData.timeoutSeconds}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('timeoutSeconds', parseInt(e.target.value))
                }
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Request timeout duration
              </p>
            </div>
          </div>

          {/* Active Status */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Enable webhook immediately
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Webhook' : 'Create Webhook'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default WebhookInlineForm;
