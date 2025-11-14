import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Clock, Archive } from 'lucide-react';
import { Conversation, ConversationStatus } from '@/types/models.types';
import { Modal, Button } from '@/components/ui';
import { useUpdateConversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface StatusChangeModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: {
  value: ConversationStatus;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'open',
    label: 'Open',
    description: 'Active conversation requiring attention',
    icon: CheckCircle,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  {
    value: 'pending',
    label: 'Pending',
    description: 'Waiting for customer response',
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    description: 'Issue has been resolved',
    icon: CheckCircle,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Conversation is closed',
    icon: Archive,
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-50',
  },
];

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus>(
    conversation.status
  );

  const { mutate: updateConversation, isPending } = useUpdateConversation();

  const handleSave = () => {
    if (selectedStatus === conversation.status) {
      onClose();
      return;
    }

    updateConversation(
      { id: conversation.id, updates: { status: selectedStatus } },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle size={20} className="text-success-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Change Status</h2>
              <p className="text-sm text-neutral-600">
                Update the conversation status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-600" />
          </button>
        </div>

        {/* Status Options */}
        <div className="mb-6 space-y-3">
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedStatus === option.value;

            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.01, x: 4 }}
                onClick={() => setSelectedStatus(option.value)}
                className={cn(
                  'w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                )}
              >
                {/* Icon */}
                <div className={cn('p-2 rounded-lg', option.bgColor)}>
                  <Icon size={20} className={option.color} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900 mb-1">
                    {option.label}
                  </div>
                  <div className="text-sm text-neutral-600">{option.description}</div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
};
