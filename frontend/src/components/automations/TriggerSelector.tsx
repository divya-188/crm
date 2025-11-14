import React from 'react';
import {
  MessageSquare,
  UserPlus,
  UserCheck,
  Tag,
  Users,
  Calendar,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface TriggerSelectorProps {
  triggerType: string;
  triggerConfig: Record<string, any>;
  onChange: (triggerType: string, triggerConfig: Record<string, any>) => void;
}

const triggers = [
  {
    type: 'message_received',
    name: 'Message Received',
    description: 'Trigger when a new message is received from a contact',
    icon: MessageSquare,
    color: 'blue',
    configFields: [
      {
        key: 'keyword',
        label: 'Keyword (optional)',
        type: 'text',
        placeholder: 'e.g., help, support',
        description: 'Trigger only when message contains this keyword',
      },
    ],
  },
  {
    type: 'conversation_created',
    name: 'Conversation Created',
    description: 'Trigger when a new conversation is started',
    icon: MessageSquare,
    color: 'green',
    configFields: [],
  },
  {
    type: 'conversation_assigned',
    name: 'Conversation Assigned',
    description: 'Trigger when a conversation is assigned to an agent',
    icon: UserCheck,
    color: 'purple',
    configFields: [],
  },
  {
    type: 'tag_added',
    name: 'Tag Added',
    description: 'Trigger when a specific tag is added to a conversation',
    icon: Tag,
    color: 'yellow',
    configFields: [
      {
        key: 'tagName',
        label: 'Tag Name',
        type: 'text',
        placeholder: 'e.g., urgent, vip',
        description: 'The tag that triggers this automation',
      },
    ],
  },
  {
    type: 'contact_created',
    name: 'Contact Created',
    description: 'Trigger when a new contact is created',
    icon: UserPlus,
    color: 'indigo',
    configFields: [],
  },
  {
    type: 'contact_updated',
    name: 'Contact Updated',
    description: 'Trigger when a contact is updated',
    icon: Users,
    color: 'pink',
    configFields: [
      {
        key: 'field',
        label: 'Field Name (optional)',
        type: 'text',
        placeholder: 'e.g., email, phone',
        description: 'Trigger only when this specific field is updated',
      },
    ],
  },
  {
    type: 'scheduled',
    name: 'Scheduled',
    description: 'Trigger at specific times or intervals',
    icon: Calendar,
    color: 'orange',
    configFields: [
      {
        key: 'schedule',
        label: 'Schedule',
        type: 'text',
        placeholder: 'e.g., 0 9 * * * (daily at 9 AM)',
        description: 'Cron expression for scheduling',
      },
    ],
  },
];

const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  triggerType,
  triggerConfig,
  onChange,
}) => {
  const selectedTrigger = triggers.find((t) => t.type === triggerType);

  const handleTriggerSelect = (type: string) => {
    onChange(type, {});
  };

  const handleConfigChange = (key: string, value: any) => {
    onChange(triggerType, { ...triggerConfig, [key]: value });
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string }> = {
      blue: {
        border: selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-blue-50 dark:bg-blue-900/20' : '',
        text: 'text-blue-600 dark:text-blue-400',
      },
      green: {
        border: selected ? 'border-green-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-green-50 dark:bg-green-900/20' : '',
        text: 'text-green-600 dark:text-green-400',
      },
      purple: {
        border: selected ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-purple-50 dark:bg-purple-900/20' : '',
        text: 'text-purple-600 dark:text-purple-400',
      },
      yellow: {
        border: selected ? 'border-yellow-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-yellow-50 dark:bg-yellow-900/20' : '',
        text: 'text-yellow-600 dark:text-yellow-400',
      },
      indigo: {
        border: selected ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : '',
        text: 'text-indigo-600 dark:text-indigo-400',
      },
      pink: {
        border: selected ? 'border-pink-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-pink-50 dark:bg-pink-900/20' : '',
        text: 'text-pink-600 dark:text-pink-400',
      },
      orange: {
        border: selected ? 'border-orange-500' : 'border-gray-200 dark:border-gray-700',
        bg: selected ? 'bg-orange-50 dark:bg-orange-900/20' : '',
        text: 'text-orange-600 dark:text-orange-400',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select Trigger Event
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose what event will trigger this automation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {triggers.map((trigger) => {
          const selected = triggerType === trigger.type;
          const colors = getColorClasses(trigger.color, selected);
          const Icon = trigger.icon;

          return (
            <Card
              key={trigger.type}
              className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${colors.border} ${colors.bg}`}
              onClick={() => handleTriggerSelect(trigger.type)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-800`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {trigger.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trigger.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Configuration Fields */}
      {selectedTrigger && selectedTrigger.configFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Trigger Configuration
          </h4>
          {selectedTrigger.configFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label}
              </label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={triggerConfig[field.key] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange(field.key, e.target.value)}
              />
              {field.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {field.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TriggerSelector;
