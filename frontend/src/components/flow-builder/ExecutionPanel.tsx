import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Code,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ExecutionLog {
  timestamp: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  action: string;
  data: any;
  duration: number;
}

interface ExecutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  executionPath: string[];
  finalContext: Record<string, any>;
  isRunning: boolean;
  currentStep: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepChange: (step: number) => void;
  error?: string;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  isOpen,
  onClose,
  logs,
  executionPath,
  finalContext,
  isRunning,
  currentStep,
  onPlay,
  onPause,
  onReset,
  onStepChange,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'variables'>('logs');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'enter':
        return <ChevronRight className="w-4 h-4 text-blue-500" />;
      case 'execute':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'exit':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'branch':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'start':
        return 'bg-green-100 text-green-700';
      case 'end':
        return 'bg-red-100 text-red-700';
      case 'message':
        return 'bg-primary-100 text-primary-700';
      case 'condition':
        return 'bg-info-100 text-info-700';
      case 'input':
        return 'bg-amber-100 text-amber-700';
      case 'delay':
        return 'bg-primary-100 text-primary-700';
      case 'api':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-96 bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-neutral-900">Execution Viewer</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onPlay}
                className="gap-2"
                disabled={currentStep >= logs.length}
              >
                <Play className="w-4 h-4" />
                {currentStep === 0 ? 'Start' : 'Resume'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          <div className="text-sm text-neutral-600">
            Step {currentStep} / {logs.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-primary-600"
            initial={{ width: 0 }}
            animate={{
              width: `${logs.length > 0 ? (currentStep / logs.length) * 100 : 0}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Execution Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Execution Logs
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'variables'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Variables
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'logs' ? (
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No execution logs yet</p>
                <p className="text-xs mt-1">Click "Start" to begin testing</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: index < currentStep ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{ delay: index * 0.05 }}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    index < currentStep
                      ? 'border-neutral-200 bg-white'
                      : 'border-neutral-100 bg-neutral-50'
                  }`}
                >
                  <button
                    onClick={() => toggleLogExpansion(index)}
                    className="w-full p-3 flex items-start gap-3 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-neutral-900 truncate">
                          {log.nodeName}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getNodeTypeColor(log.nodeType)}`}
                        >
                          {log.nodeType}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600 capitalize">
                        {log.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-neutral-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {log.duration > 0 && (
                          <span className="text-xs text-neutral-500">
                            • {log.duration}ms
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedLogs.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedLogs.has(index) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-neutral-200 bg-neutral-50"
                      >
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4 text-neutral-500" />
                            <span className="text-xs font-medium text-neutral-700">
                              Execution Data
                            </span>
                          </div>
                          <pre className="text-xs text-neutral-600 bg-white p-2 rounded border border-neutral-200 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4">
            {Object.keys(finalContext).length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No variables yet</p>
                <p className="text-xs mt-1">Variables will appear during execution</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(finalContext).map(([key, value]) => (
                  <Card key={key} variant="outlined" padding="sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 mb-1">
                          {key}
                        </p>
                        <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-200 overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-words">
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ExecutionPanel;
