import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TestTube, CheckCircle, XCircle, Loader } from 'lucide-react';
import { webhooksService } from '@/services/webhooks.service';
import { Webhook } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import toast from '@/lib/toast';

interface WebhookTestModalProps {
  webhook: Webhook;
  onClose: () => void;
}

export function WebhookTestModal({ webhook, onClose }: WebhookTestModalProps) {
  const [eventType, setEventType] = useState(webhook.events[0] || '');
  const [customPayload, setCustomPayload] = useState('');
  const [useCustomPayload, setUseCustomPayload] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch available events
  const { data: availableEvents } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => webhooksService.getAvailableEvents(),
  });

  const testMutation = useMutation({
    mutationFn: (data: { eventType: string; payload?: any }) =>
      webhooksService.testWebhook(webhook.id, data),
    onSuccess: (data) => {
      setTestResult({ success: true, data });
      toast.success('Webhook test initiated successfully');
    },
    onError: (error: any) => {
      setTestResult({ success: false, error: error.response?.data || error.message });
      toast.error('Webhook test failed');
    },
  });

  const handleTest = () => {
    let payload = undefined;

    if (useCustomPayload && customPayload.trim()) {
      try {
        payload = JSON.parse(customPayload);
      } catch (error) {
        toast.error('Invalid JSON payload');
        return;
      }
    }

    testMutation.mutate({ eventType, payload });
  };

  const getSamplePayload = (event: string) => {
    const samples: Record<string, any> = {
      'message.new': {
        messageId: 'msg_123456',
        conversationId: 'conv_123456',
        contactId: 'contact_123456',
        direction: 'inbound',
        type: 'text',
        content: 'Hello, this is a test message',
        timestamp: new Date().toISOString(),
      },
      'conversation.created': {
        conversationId: 'conv_123456',
        contactId: 'contact_123456',
        status: 'open',
        timestamp: new Date().toISOString(),
      },
      'campaign.completed': {
        campaignId: 'campaign_123456',
        name: 'Test Campaign',
        totalRecipients: 100,
        sentCount: 95,
        deliveredCount: 90,
        failedCount: 5,
        timestamp: new Date().toISOString(),
      },
    };

    return (
      samples[event] || {
        event,
        message: 'This is a test webhook payload',
        timestamp: new Date().toISOString(),
      }
    );
  };

  const handleLoadSample = () => {
    const sample = getSamplePayload(eventType);
    setCustomPayload(JSON.stringify(sample, null, 2));
    setUseCustomPayload(true);
  };

  // Filter events to only show those the webhook is subscribed to
  const subscribedEvents = availableEvents?.filter(
    (event) => webhook.events.includes(event) || webhook.events.includes('*')
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Test Webhook" size="lg">
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Testing: {webhook.name}
              </h4>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                URL: {webhook.url}
              </p>
            </div>
          </div>
        </div>

        {/* Event Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Type
          </label>
          <Select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            disabled={testMutation.isPending}
            options={[
              { value: '', label: 'Select an event' },
              ...(subscribedEvents?.map((event) => ({
                value: event,
                label: event,
              })) || []),
            ]}
          />
        </div>

        {/* Custom Payload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomPayload}
                onChange={(e) => setUseCustomPayload(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={testMutation.isPending}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use custom payload
              </span>
            </label>
            {useCustomPayload && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                disabled={testMutation.isPending}
              >
                Load sample
              </button>
            )}
          </div>

          {useCustomPayload && (
            <Textarea
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder="Enter JSON payload..."
              rows={8}
              className="font-mono text-sm"
              disabled={testMutation.isPending}
            />
          )}

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {useCustomPayload
              ? 'Enter a custom JSON payload for testing'
              : 'A sample payload will be generated automatically'}
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`rounded-lg p-4 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <h4
                  className={`text-sm font-medium ${
                    testResult.success
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </h4>
                <pre
                  className={`mt-2 text-xs overflow-auto max-h-40 ${
                    testResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={testMutation.isPending}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={!eventType || testMutation.isPending}>
            {testMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Send Test
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
