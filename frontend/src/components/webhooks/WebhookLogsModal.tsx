import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { webhooksService } from '@/services/webhooks.service';
import { Webhook } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

interface WebhookLogsModalProps {
  webhook: Webhook;
  onClose: () => void;
}

export function WebhookLogsModal({ webhook, onClose }: WebhookLogsModalProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  // Fetch webhook logs
  const {
    data: logs,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['webhook-logs', webhook.id, limit],
    queryFn: () => webhooksService.getWebhookLogs(webhook.id, limit),
  });

  // Fetch webhook stats
  const { data: stats } = useQuery({
    queryKey: ['webhook-stats', webhook.id],
    queryFn: () => webhooksService.getWebhookStats(webhook.id),
  });

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Webhook Logs" size="xl">
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {webhook.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{webhook.url}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDeliveries}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Deliveries</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.successfulDeliveries}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Successful</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.failedDeliveries}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgResponseTimeMs}ms
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
              </div>
            </div>
          )}
        </div>

        {/* Logs List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recent Deliveries
            </h4>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={25}>Last 25</option>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : logs && logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No webhook deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs?.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {log.isSuccess ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {log.eventType}
                          </Badge>
                          {log.responseStatus && (
                            <Badge
                              variant={log.isSuccess ? 'success' : 'danger'}
                              className="text-xs"
                            >
                              {log.responseStatus}
                            </Badge>
                          )}
                          {log.attemptCount > 1 && (
                            <Badge variant="warning" className="text-xs">
                              Retry {log.attemptCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatResponseTime(log.responseTimeMs)}
                        </div>
                      </div>

                      {expandedLogId === log.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedLogId === log.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                      {/* Error Message */}
                      {log.errorMessage && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Error Message
                          </h5>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {log.errorMessage}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Request Payload */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Request Payload
                        </h5>
                        <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 text-xs overflow-auto max-h-40">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>

                      {/* Response Body */}
                      {log.responseBody && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Response Body
                          </h5>
                          <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 text-xs overflow-auto max-h-40">
                            {log.responseBody}
                          </pre>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Status:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {log.responseStatus || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Response Time:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {formatResponseTime(log.responseTimeMs)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Attempts:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {log.attemptCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
