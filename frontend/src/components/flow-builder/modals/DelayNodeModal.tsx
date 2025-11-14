import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface DelayNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DelayNodeData) => void;
  initialData?: DelayNodeData;
}

export interface DelayNodeData {
  label?: string;
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

const DelayNodeModal: React.FC<DelayNodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [label, setLabel] = useState(initialData?.label || 'Delay');
  const [duration, setDuration] = useState(initialData?.duration?.toString() || '');
  const [unit, setUnit] = useState<DelayNodeData['unit']>(initialData?.unit || 'seconds');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || 'Delay');
      setDuration(initialData.duration?.toString() || '');
      setUnit(initialData.unit || 'seconds');
    }
  }, [initialData]);

  const handleSave = () => {
    const durationNum = parseInt(duration);
    if (!durationNum || durationNum <= 0) {
      return;
    }

    onSave({
      label: label.trim() || 'Delay',
      duration: durationNum,
      unit,
    });
    onClose();
  };

  const handleCancel = () => {
    setLabel(initialData?.label || 'Delay');
    setDuration(initialData?.duration?.toString() || '');
    setUnit(initialData?.unit || 'seconds');
    onClose();
  };

  const isValid = duration && parseInt(duration) > 0;

  // Calculate total seconds for display
  const getTotalSeconds = () => {
    const durationNum = parseInt(duration) || 0;
    switch (unit) {
      case 'seconds':
        return durationNum;
      case 'minutes':
        return durationNum * 60;
      case 'hours':
        return durationNum * 3600;
      case 'days':
        return durationNum * 86400;
      default:
        return 0;
    }
  };

  const formatDuration = () => {
    const durationNum = parseInt(duration) || 0;
    if (!durationNum) return 'No delay set';
    return `${durationNum} ${unit}`;
  };

  const getRecommendedRange = () => {
    switch (unit) {
      case 'seconds':
        return '1-60 seconds';
      case 'minutes':
        return '1-60 minutes';
      case 'hours':
        return '1-24 hours';
      case 'days':
        return '1-30 days';
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Configure Delay Node"
      description="Add a pause in the flow execution before continuing"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid}>
            Save Configuration
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Node Label */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Node Label
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Wait for Response"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Delay Duration *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Enter duration"
                min="1"
              />
            </div>
            <div>
              <Select
                value={unit}
                onChange={(e) => setUnit(e.target.value as DelayNodeData['unit'])}
                options={[
                  { value: 'seconds', label: 'Seconds' },
                  { value: 'minutes', label: 'Minutes' },
                  { value: 'hours', label: 'Hours' },
                  { value: 'days', label: 'Days' },
                ]}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Recommended range: {getRecommendedRange()}
          </p>
        </div>

        {/* Duration Summary */}
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary-50 border border-secondary-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="w-6 h-6 text-secondary-600" />
              </motion.div>
              <div>
                <div className="text-sm font-medium text-secondary-900">
                  Total Delay: {formatDuration()}
                </div>
                <div className="text-xs text-secondary-700 mt-0.5">
                  {getTotalSeconds().toLocaleString()} seconds
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Preview
          </label>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Clock className="w-5 h-5 text-secondary-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 mb-2">
                  {label || 'Delay'}
                </div>
                <div className="text-sm text-neutral-600">
                  Flow will pause for{' '}
                  <span className="font-semibold text-secondary-700">
                    {formatDuration()}
                  </span>{' '}
                  before continuing to the next node.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-secondary-900 mb-2">
            💡 Common Use Cases
          </h4>
          <ul className="text-sm text-secondary-800 space-y-1">
            <li>• <strong>Short delays (seconds):</strong> Simulate typing or natural conversation flow</li>
            <li>• <strong>Medium delays (minutes):</strong> Wait for user action or response</li>
            <li>• <strong>Long delays (hours/days):</strong> Schedule follow-ups or reminders</li>
          </ul>
        </div>

        {/* Important Note */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-warning-900 mb-2">
            ⚠️ Important
          </h4>
          <p className="text-sm text-warning-800">
            The flow execution will be paused for the specified duration. During this time,
            the conversation will remain in a waiting state. Make sure the delay duration
            is appropriate for your use case.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DelayNodeModal;
