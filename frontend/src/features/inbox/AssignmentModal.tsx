import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Search, Loader2 } from 'lucide-react';
import { Conversation } from '@/types/models.types';
import { Modal, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services';
import { useAssignConversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface AssignmentModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    conversation.assignedAgentId || null
  );

  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => usersService.getAgents({ limit: 100 }),
    enabled: isOpen,
  });

  const { mutate: assignConversation, isPending } = useAssignConversation();

  const agents = agentsData?.data || [];

  const filteredAgents = agents.filter((agent) => {
    const query = searchQuery.toLowerCase();
    return (
      agent.firstName.toLowerCase().includes(query) ||
      agent.lastName.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query)
    );
  });

  const handleAssign = () => {
    if (!selectedAgentId) return;

    assignConversation(
      { id: conversation.id, agentId: selectedAgentId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleUnassign = () => {
    assignConversation(
      { id: conversation.id, agentId: '' },
      {
        onSuccess: () => {
          setSelectedAgentId(null);
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
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserPlus size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Assign Conversation</h2>
              <p className="text-sm text-neutral-600">
                Assign this conversation to an agent
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

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Agents List */}
        <div className="mb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-600" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              {searchQuery ? 'No agents found' : 'No agents available'}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredAgents.map((agent) => (
                <motion.button
                  key={agent.id}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                    selectedAgentId === agent.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  )}
                >
                  {/* Avatar */}
                  {agent.avatarUrl ? (
                    <img
                      src={agent.avatarUrl}
                      alt={`${agent.firstName} ${agent.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600">
                        {agent.firstName[0]}
                        {agent.lastName[0]}
                      </span>
                    </div>
                  )}

                  {/* Agent Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-neutral-900">
                      {agent.firstName} {agent.lastName}
                    </div>
                    <div className="text-sm text-neutral-600">{agent.email}</div>
                  </div>

                  {/* Status */}
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      agent.status === 'online'
                        ? 'bg-success-500'
                        : agent.status === 'away'
                        ? 'bg-warning-500'
                        : agent.status === 'busy'
                        ? 'bg-danger-500'
                        : 'bg-neutral-400'
                    )}
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {conversation.assignedAgentId && (
            <Button
              variant="outline"
              onClick={handleUnassign}
              disabled={isPending}
              fullWidth
            >
              Unassign
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedAgentId || isPending}
            loading={isPending}
            fullWidth
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
};
