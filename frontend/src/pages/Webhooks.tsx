import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Webhook as WebhookIcon,
  Activity,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  TestTube,
  Eye,
} from 'lucide-react';
import { webhooksService } from '@/services/webhooks.service';
import { Webhook } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import toast from '@/lib/toast';
import {
  WebhookFormModal,
  WebhookDeleteModal,
  WebhookTestModal,
  WebhookLogsModal,
} from '@/components/webhooks';

export default function Webhooks() {
  const queryClient = useQueryClient();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhooksService.getWebhooks(),
  });

  // Toggle webhook status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      webhooksService.updateWebhook(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook status updated');
    },
    onError: () => {
      toast.error('Failed to update webhook status');
    },
  });

  const handleCreate = () => {
    setSelectedWebhook(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsFormModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleTest = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsTestModalOpen(true);
    setOpenMenuId(null);
  };

  const handleViewLogs = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsLogsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleToggleStatus = (webhook: Webhook) => {
    toggleStatusMutation.mutate({
      id: webhook.id,
      isActive: !webhook.isActive,
    });
    setOpenMenuId(null);
  };

  const getSuccessRate = (webhook: Webhook) => {
    if (webhook.totalDeliveries === 0) return 0;
    return Math.round((webhook.successfulDeliveries / webhook.totalDeliveries) * 100);
  };

  const getStatusBadge = (webhook: Webhook) => {
    if (!webhook.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    const successRate = getSuccessRate(webhook);
    if (successRate >= 90) {
      return <Badge variant="success">Healthy</Badge>;
    } else if (successRate >= 70) {
      return <Badge variant="warning">Degraded</Badge>;
    } else if (webhook.totalDeliveries > 0) {
      return <Badge variant="danger">Failing</Badge>;
    }
    return <Badge variant="secondary">No Data</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      {webhooks && webhooks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <WebhookIcon className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No webhooks configured
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first webhook to receive event notifications.
            </p>
            <Button onClick={handleCreate} className="mt-6">
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {webhooks?.map((webhook) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="relative p-6 hover:shadow-lg transition-shadow">
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === webhook.id ? null : webhook.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === webhook.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <button
                        onClick={() => handleEdit(webhook)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleTest(webhook)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </button>
                      <button
                        onClick={() => handleViewLogs(webhook)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Logs
                      </button>
                      <button
                        onClick={() => handleToggleStatus(webhook)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        {webhook.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(webhook)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
                        {webhook.name}
                      </h3>
                    </div>
                    {getStatusBadge(webhook)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">URL:</span>
                      <p className="text-gray-900 dark:text-white truncate">{webhook.url}</p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Events:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.slice(0, 3).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{webhook.events.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Activity className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {webhook.totalDeliveries}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {webhook.successfulDeliveries}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Success</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {webhook.failedDeliveries}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
                    </div>
                  </div>

                  {webhook.totalDeliveries > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Success Rate</span>
                        <span className="font-medium">{getSuccessRate(webhook)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            getSuccessRate(webhook) >= 90
                              ? 'bg-green-500'
                              : getSuccessRate(webhook) >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${getSuccessRate(webhook)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isFormModalOpen && (
        <WebhookFormModal
          webhook={selectedWebhook}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedWebhook(null);
          }}
        />
      )}

      {isDeleteModalOpen && selectedWebhook && (
        <WebhookDeleteModal
          webhook={selectedWebhook}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedWebhook(null);
          }}
        />
      )}

      {isTestModalOpen && selectedWebhook && (
        <WebhookTestModal
          webhook={selectedWebhook}
          onClose={() => {
            setIsTestModalOpen(false);
            setSelectedWebhook(null);
          }}
        />
      )}

      {isLogsModalOpen && selectedWebhook && (
        <WebhookLogsModal
          webhook={selectedWebhook}
          onClose={() => {
            setIsLogsModalOpen(false);
            setSelectedWebhook(null);
          }}
        />
      )}
    </div>
  );
}
