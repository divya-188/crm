import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, TrendingUp, Zap } from 'lucide-react';
import { apiKeysService } from '@/services/api-keys.service';
import { ApiKey } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

interface ApiKeyUsageModalProps {
  apiKey: ApiKey;
  onClose: () => void;
}

export function ApiKeyUsageModal({ apiKey, onClose }: ApiKeyUsageModalProps) {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['api-key-usage', apiKey.id],
    queryFn: () => apiKeysService.getApiKeyUsage(apiKey.id),
  });

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getStatusBadge = () => {
    if (!usage?.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (usage.expiresAt && new Date(usage.expiresAt) < new Date()) {
      return <Badge variant="danger">Expired</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="API Key Usage Statistics"
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {apiKey.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
              {apiKey.keyPrefix}...
            </p>
          </div>
          {usage && getStatusBadge()}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : usage ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {usage.totalRequests.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Total Requests</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {usage.rateLimit}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Requests / {usage.rateLimitWindow}s
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Used
                  </span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(usage.lastUsedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Request
                  </span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(usage.lastRequestAt)}
                </span>
              </div>

              {usage.expiresAt && (
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expires At
                    </span>
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(usage.expiresAt)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  {usage.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Rate Limit Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Rate Limit Configuration
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This API key is limited to <strong>{usage.rateLimit} requests</strong> per{' '}
                <strong>{usage.rateLimitWindow} seconds</strong>. Requests exceeding this limit
                will receive a 429 (Too Many Requests) response.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Failed to load usage statistics
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
