import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { automationsService } from '@/services/automations.service';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { fadeInUp } from '@/lib/motion-variants';

interface ExecutionLogsModalProps {
  automationId: string;
  automationName: string;
  onClose: () => void;
}

const ExecutionLogsModal: React.FC<ExecutionLogsModalProps> = ({
  automationId,
  automationName,
  onClose,
}) => {
  const [page, setPage] = useState(1);
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());

  const { data: executionsData, isLoading } = useQuery({
    queryKey: ['automation-executions', automationId, page],
    queryFn: () =>
      automationsService.getExecutions(automationId, {
        page,
        limit: 20,
      }),
  });

  const toggleExpanded = (executionId: string) => {
    setExpandedExecutions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      case 'partial':
        return <Badge variant="warning">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Execution Logs - ${automationName}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header Stats */}
        {executionsData && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Executions: {executionsData.total}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {Math.ceil((executionsData.total || 0) / (executionsData.limit || 20))}
              </div>
            </div>
          </div>
        )}

        {/* Executions List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
                >
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : executionsData && executionsData.data.length > 0 ? (
            <AnimatePresence>
              {executionsData.data.map((execution: any) => (
                <motion.div
                  key={execution.id}
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Execution Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    onClick={() => toggleExpanded(execution.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(execution.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(execution.status)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(execution.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(execution.executionTimeMs)}</span>
                            </div>
                            {execution.executionResults && (
                              <span>
                                {execution.executionResults.length} action(s) executed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {expandedExecutions.has(execution.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Execution Details */}
                  <AnimatePresence>
                    {expandedExecutions.has(execution.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-4 space-y-4">
                          {/* Trigger Data */}
                          {execution.triggerData && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Trigger Data
                              </h4>
                              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs overflow-x-auto">
                                {JSON.stringify(execution.triggerData, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Execution Results */}
                          {execution.executionResults && execution.executionResults.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Action Results
                              </h4>
                              <div className="space-y-2">
                                {execution.executionResults.map((result: any, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-gray-50 dark:bg-gray-900 rounded p-3"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      {result.success ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-600" />
                                      )}
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {result.actionType}
                                      </span>
                                    </div>
                                    {result.error && (
                                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error Message */}
                          {execution.errorMessage && (
                            <div>
                              <h4 className="text-sm font-semibold text-red-600 mb-2">
                                Error Message
                              </h4>
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  {execution.errorMessage}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No execution logs found
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {executionsData && (executionsData.total || 0) > (executionsData.limit || 20) && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.ceil((executionsData.total || 0) / (executionsData.limit || 20))}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil((executionsData.total || 0) / (executionsData.limit || 20))}
            >
              Next
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExecutionLogsModal;
