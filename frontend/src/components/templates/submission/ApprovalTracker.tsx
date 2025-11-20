import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Loader2,
  Info,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { templatesService } from '@/services/templates.service';
import { Template, TemplateStatus } from '@/types/models.types';
import { formatDistanceToNow, format } from 'date-fns';
import { RejectionHandler } from './RejectionHandler';

interface ApprovalTrackerProps {
  templateId: string;
  initialTemplate?: Template;
  onStatusChange?: (template: Template) => void;
  onEditAndResubmit?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface StatusHistoryItem {
  id: string;
  fromStatus: TemplateStatus | null;
  toStatus: TemplateStatus;
  reason?: string;
  changedAt: string;
  changedBy?: {
    id: string;
    name: string;
  };
}

interface StatusConfig {
  label: string;
  color: 'neutral' | 'info' | 'success' | 'danger' | 'warning';
  icon: React.ComponentType<any>;
  description: string;
}

const statusConfigs: Record<TemplateStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'neutral',
    icon: FileText,
    description: 'Template is being created',
  },
  pending: {
    label: 'Pending Review',
    color: 'warning',
    icon: Clock,
    description: 'Submitted to Meta for approval',
  },
  approved: {
    label: 'Approved',
    color: 'success',
    icon: CheckCircle,
    description: 'Template approved and ready to use',
  },
  rejected: {
    label: 'Rejected',
    color: 'danger',
    icon: XCircle,
    description: 'Template rejected by Meta',
  },
};

/**
 * ApprovalTracker Component
 * 
 * Displays template approval status with timeline visualization:
 * - Current status with visual indicators
 * - Status change history timeline
 * - Auto-refresh for pending templates
 * - Manual refresh button
 * - Estimated approval time
 * 
 * Features:
 * - Real-time status updates via polling
 * - Status timeline with timestamps
 * - Color-coded status badges
 * - Rejection reason display
 * - Estimated approval time for pending templates
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.6, 8.7
 */
export const ApprovalTracker: React.FC<ApprovalTrackerProps> = ({
  templateId,
  initialTemplate,
  onStatusChange,
  onEditAndResubmit,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes default
}) => {
  const [template, setTemplate] = useState<Template | null>(initialTemplate || null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(!initialTemplate);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Fetch template data
  const fetchTemplate = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await templatesService.getTemplate(templateId);
      setTemplate(data);
      setLastRefreshTime(new Date());

      // Call status change callback
      if (onStatusChange) {
        onStatusChange(data);
      }

      // Build status history from template data
      // Note: This is a simplified version. In production, you'd fetch from a dedicated endpoint
      const history: StatusHistoryItem[] = [];
      
      if (data.createdAt) {
        history.push({
          id: '1',
          fromStatus: null,
          toStatus: 'draft',
          changedAt: data.createdAt,
        });
      }

      if (data.submittedAt) {
        history.push({
          id: '2',
          fromStatus: 'draft',
          toStatus: 'pending',
          changedAt: data.submittedAt,
        });
      }

      if (data.approvedAt) {
        history.push({
          id: '3',
          fromStatus: 'pending',
          toStatus: 'approved',
          changedAt: data.approvedAt,
        });
      }

      if (data.status === 'rejected' && data.rejectionReason) {
        history.push({
          id: '4',
          fromStatus: 'pending',
          toStatus: 'rejected',
          reason: data.rejectionReason,
          changedAt: data.updatedAt,
        });
      }

      setStatusHistory(history);
    } catch (err: any) {
      console.error('Error fetching template:', err);
      setError(err.response?.data?.message || 'Failed to load template status');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [templateId, onStatusChange]);

  // Initial load
  useEffect(() => {
    if (!initialTemplate) {
      fetchTemplate();
    }
  }, [initialTemplate, fetchTemplate]);

  // Auto-refresh for pending templates
  useEffect(() => {
    if (!autoRefresh || !template || template.status !== 'pending') {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTemplate(false);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, template, refreshInterval, fetchTemplate]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchTemplate(false);
  };

  // Calculate estimated approval time
  const getEstimatedApprovalTime = () => {
    if (!template || template.status !== 'pending' || !template.submittedAt) {
      return null;
    }

    const submittedDate = new Date(template.submittedAt);
    const now = new Date();
    const hoursSinceSubmission = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);

    // Typical approval time is 1-2 hours
    if (hoursSinceSubmission < 1) {
      return 'Usually within 1-2 hours';
    } else if (hoursSinceSubmission < 2) {
      return 'Should be approved soon';
    } else if (hoursSinceSubmission < 24) {
      return 'Taking longer than usual';
    } else {
      return 'Please contact support if not approved within 24 hours';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Loading template status...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900">Error Loading Status</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTemplate()}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const currentStatusConfig = statusConfigs[template.status];
  const StatusIcon = currentStatusConfig.icon;
  const estimatedTime = getEstimatedApprovalTime();

  return (
    <div className="space-y-6">
      {/* Rejection Handler - Show when template is rejected */}
      {template.status === 'rejected' && onEditAndResubmit && (
        <RejectionHandler
          template={template}
          onEditAndResubmit={onEditAndResubmit}
        />
      )}

      {/* Current Status Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                currentStatusConfig.color === 'success' && 'bg-green-100',
                currentStatusConfig.color === 'warning' && 'bg-yellow-100',
                currentStatusConfig.color === 'danger' && 'bg-red-100',
                currentStatusConfig.color === 'neutral' && 'bg-gray-100',
                currentStatusConfig.color === 'info' && 'bg-blue-100'
              )}
            >
              <StatusIcon
                className={cn(
                  'h-6 w-6',
                  currentStatusConfig.color === 'success' && 'text-green-600',
                  currentStatusConfig.color === 'warning' && 'text-yellow-600',
                  currentStatusConfig.color === 'danger' && 'text-red-600',
                  currentStatusConfig.color === 'neutral' && 'text-gray-600',
                  currentStatusConfig.color === 'info' && 'text-blue-600'
                )}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStatusConfig.label}
                </h3>
                <Badge variant={currentStatusConfig.color} size="sm">
                  {template.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                {currentStatusConfig.description}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            icon={
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            }
            title="Refresh status"
          >
            Refresh
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500">
          Last updated {formatDistanceToNow(lastRefreshTime, { addSuffix: true })}
        </div>

        {/* Estimated Approval Time for Pending Templates */}
        {template.status === 'pending' && estimatedTime && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3"
          >
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Estimated Approval Time
                </p>
                <p className="text-sm text-blue-700 mt-0.5">{estimatedTime}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rejection Reason */}
        {template.status === 'rejected' && template.rejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-1">{template.rejectionReason}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Status History</h4>

        {statusHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No status history available</p>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {statusHistory.map((item, index) => {
                const config = statusConfigs[item.toStatus];
                const ItemIcon = config.icon;
                const isLast = index === statusHistory.length - 1;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                      )}

                      {/* Status Icon */}
                      <div
                        className={cn(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white',
                          config.color === 'success' && 'bg-green-100',
                          config.color === 'warning' && 'bg-yellow-100',
                          config.color === 'danger' && 'bg-red-100',
                          config.color === 'neutral' && 'bg-gray-100',
                          config.color === 'info' && 'bg-blue-100'
                        )}
                      >
                        <ItemIcon
                          className={cn(
                            'h-4 w-4',
                            config.color === 'success' && 'text-green-600',
                            config.color === 'warning' && 'text-yellow-600',
                            config.color === 'danger' && 'text-red-600',
                            config.color === 'neutral' && 'text-gray-600',
                            config.color === 'info' && 'text-blue-600'
                          )}
                        />
                      </div>

                      {/* Status Details */}
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(item.changedAt), 'MMM d, yyyy h:mm a')}
                              {' • '}
                              {formatDistanceToNow(new Date(item.changedAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <Badge variant={config.color} size="sm">
                            {item.toStatus.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Reason (for rejections) */}
                        {item.reason && (
                          <div className="mt-2 rounded border border-red-200 bg-red-50 p-2">
                            <p className="text-xs text-red-700">{item.reason}</p>
                          </div>
                        )}

                        {/* Changed By */}
                        {item.changedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {item.changedBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Auto-refresh Indicator for Pending Templates */}
      {template.status === 'pending' && autoRefresh && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              Auto-refreshing every {refreshInterval / 1000 / 60} minutes to check for
              status updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalTracker;
