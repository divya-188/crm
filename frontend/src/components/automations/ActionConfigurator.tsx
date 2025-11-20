import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  MessageSquare,
  UserCheck,
  Tag,
  Edit,
  Zap,
  Mail,
  Webhook,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AutomationAction } from '@/services/automations.service';
import { usersService } from '@/services/users.service';
import { flowsService } from '@/services/flows.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ActionConfiguratorProps {
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
}

const actionTypes = [
  {
    type: 'send_message',
    name: 'Send Message',
    description: 'Send a WhatsApp message to the contact',
    icon: MessageSquare,
    color: 'blue',
  },
  {
    type: 'assign_conversation',
    name: 'Assign Conversation',
    description: 'Assign the conversation to a specific agent',
    icon: UserCheck,
    color: 'purple',
  },
  {
    type: 'add_tag',
    name: 'Add Tag',
    description: 'Add a tag to the conversation or contact',
    icon: Tag,
    color: 'green',
  },
  {
    type: 'remove_tag',
    name: 'Remove Tag',
    description: 'Remove a tag from the conversation or contact',
    icon: Tag,
    color: 'red',
  },
  {
    type: 'update_contact',
    name: 'Update Contact',
    description: 'Update contact field values',
    icon: Edit,
    color: 'yellow',
  },
  {
    type: 'trigger_flow',
    name: 'Trigger Flow',
    description: 'Start a chatbot flow',
    icon: Zap,
    color: 'indigo',
  },
  {
    type: 'send_email',
    name: 'Send Email',
    description: 'Send an email notification',
    icon: Mail,
    color: 'pink',
  },
  {
    type: 'webhook',
    name: 'Call Webhook',
    description: 'Make an HTTP request to an external URL',
    icon: Webhook,
    color: 'orange',
  },
];

const ActionConfigurator: React.FC<ActionConfiguratorProps> = ({
  actions,
  onChange,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Fetch agents for assignment action
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => usersService.getAgents({ limit: 100 }),
  });

  // Fetch flows for trigger flow action
  const { data: flowsData } = useQuery({
    queryKey: ['flows'],
    queryFn: () => flowsService.getFlows({ limit: 100, status: 'active' }),
  });

  const handleAddAction = (type: string) => {
    const newAction: AutomationAction = {
      type: type as any,
      config: {},
    };
    onChange([...actions, newAction]);
    setEditingIndex(actions.length);
    setIsAddModalOpen(false);
  };

  const handleRemoveAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleConfigChange = (index: number, config: Record<string, any>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], config };
    onChange(updated);
  };

  const getActionIcon = (type: string) => {
    const actionType = actionTypes.find((a) => a.type === type);
    return actionType?.icon || MessageSquare;
  };

  const getActionName = (type: string) => {
    const actionType = actionTypes.find((a) => a.type === type);
    return actionType?.name || type;
  };

  const renderActionConfig = (action: AutomationAction, index: number) => {
    const config = action.config;

    switch (action.type) {
      case 'send_message':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Content *
              </label>
              <Textarea
                placeholder="Enter message content... Use {{contact.name}} for personalization"
                value={config.message || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleConfigChange(index, { ...config, message: e.target.value })
                }
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You can use variables like {`{{contact.name}}`}, {`{{contact.email}}`}
              </p>
            </div>
          </div>
        );

      case 'assign_conversation':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To *
              </label>
              <Select
                value={config.agentId || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleConfigChange(index, { ...config, agentId: e.target.value })
                }
                options={[
                  { value: '', label: 'Select an agent...' },
                  ...(agentsData?.data.map((agent) => ({
                    value: agent.id,
                    label: `${agent.firstName} ${agent.lastName}`,
                  })) || []),
                ]}
              />
            </div>
          </div>
        );

      case 'add_tag':
      case 'remove_tag':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., urgent, vip, follow-up"
                value={config.tagName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleConfigChange(index, { ...config, tagName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apply To
              </label>
              <Select
                value={config.target || 'conversation'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleConfigChange(index, { ...config, target: e.target.value })
                }
                options={[
                  { value: 'conversation', label: 'Conversation' },
                  { value: 'contact', label: 'Contact' },
                ]}
              />
            </div>
          </div>
        );

      case 'update_contact':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., email, phone, customField"
                value={config.fieldName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleConfigChange(index, { ...config, fieldName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field Value *
              </label>
              <Input
                type="text"
                placeholder="Enter value..."
                value={config.fieldValue || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleConfigChange(index, { ...config, fieldValue: e.target.value })
                }
              />
            </div>
          </div>
        );

      case 'trigger_flow':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Flow *
              </label>
              <Select
                value={config.flowId || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleConfigChange(index, { ...config, flowId: e.target.value })
                }
                options={[
                  { value: '', label: 'Select a flow...' },
                  ...(flowsData?.data.map((flow) => ({
                    value: flow.id,
                    label: flow.name,
                  })) || []),
                ]}
              />
            </div>
          </div>
        );

      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Email *
              </label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={config.to || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleConfigChange(index, { ...config, to: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <Input
                type="text"
                placeholder="Email subject"
                value={config.subject || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleConfigChange(index, { ...config, subject: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <Textarea
                placeholder="Email content..."
                value={config.body || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleConfigChange(index, { ...config, body: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook URL *
              </label>
              <Input
                type="url"
                placeholder="https://example.com/webhook"
                value={config.url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleConfigChange(index, { ...config, url: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Method
              </label>
              <Select
                value={config.method || 'POST'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleConfigChange(index, { ...config, method: e.target.value })
                }
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'PATCH', label: 'PATCH' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headers (JSON)
              </label>
              <Textarea
                placeholder='{"Content-Type": "application/json"}'
                value={config.headers || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleConfigChange(index, { ...config, headers: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Configure Actions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Define what actions should be executed when the trigger and conditions are met
        </p>
      </div>

      {actions.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No actions configured. Add at least one action to complete the automation.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Action
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = getActionIcon(action.type);
            const isExpanded = expandedIndex === index;

            return (
              <Card key={index} className="overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {getActionName(action.type)}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Action {index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRemoveAction(index);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {renderActionConfig(action, index)}
                  </div>
                )}
              </Card>
            );
          })}

          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="secondary"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Action
          </Button>
        </div>
      )}

      {/* Add Action Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Select Action Type"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionTypes.map((actionType) => {
              const Icon = actionType.icon;
              return (
                <Card
                  key={actionType.type}
                  className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary-500"
                  onClick={() => handleAddAction(actionType.type)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {actionType.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {actionType.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActionConfigurator;
