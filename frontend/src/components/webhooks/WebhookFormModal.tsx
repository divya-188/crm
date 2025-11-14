import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { webhooksService } from '@/services/webhooks.service';
import { Webhook, CreateWebhookDto } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import toast from '@/lib/toast';

interface WebhookFormModalProps {
  webhook: Webhook | null;
  onClose: () => void;
}

export function WebhookFormModal({ webhook, onClose }: WebhookFormModalProps) {
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret || '',
        retryCount: webhook.retryCount,
        timeoutSeconds: webhook.timeoutSeconds,
        isActive: webhook.isActive,
      });
      setSelectedEvents(new Set(webhook.events));
    }
  }, [webhook]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWebhookDto) => webhooksService.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create webhook');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateWebhookDto) =>
      webhooksService.updateWebhook(webhook!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook updated successfully');
      onClose();
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

    if (webhook) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={webhook ? 'Edit Webhook' : 'Create Webhook'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Webhook Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., New Message Webhook"
            required
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Webhook URL *
          </label>
          <Input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com/webhook"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The URL where webhook events will be sent
          </p>
        </div>

        {/* Events */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Events to Subscribe *
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {selectedEvents.size === availableEvents?.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4">
            {Object.entries(groupedEvents).map(([category, events]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {category}
                </h4>
                <div className="space-y-2 ml-2">
                  {events.map((event) => (
                    <label
                      key={event}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                    >
                      <Checkbox
                        checked={selectedEvents.has(event)}
                        onChange={() => handleEventToggle(event)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {event}
                        {event === '*' && (
                          <span className="ml-2 text-xs text-gray-500">(All events)</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Selected {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Secret */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Secret (Optional)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                placeholder="Leave empty to auto-generate"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="button" variant="secondary" onClick={generateSecret}>
              Generate
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used to verify webhook signatures (HMAC SHA-256)
          </p>
        </div>

        {/* Advanced Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retry Count
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.retryCount}
              onChange={(e) =>
                setFormData({ ...formData, retryCount: parseInt(e.target.value) })
              }
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Number of retry attempts on failure
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timeout (seconds)
            </label>
            <Input
              type="number"
              min="5"
              max="120"
              value={formData.timeoutSeconds}
              onChange={(e) =>
                setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) })
              }
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Request timeout duration
            </p>
          </div>
        </div>

        {/* Active Status */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Enable webhook immediately
          </span>
        </label>

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
              : webhook
              ? 'Update Webhook'
              : 'Create Webhook'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
