import React from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import { AutomationCondition } from '@/services/automations.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface ConditionBuilderProps {
  conditions: AutomationCondition[];
  onChange: (conditions: AutomationCondition[]) => void;
}

const fieldOptions = [
  { value: 'contact.name', label: 'Contact Name' },
  { value: 'contact.email', label: 'Contact Email' },
  { value: 'contact.phone', label: 'Contact Phone' },
  { value: 'contact.tags', label: 'Contact Tags' },
  { value: 'message.content', label: 'Message Content' },
  { value: 'message.type', label: 'Message Type' },
  { value: 'conversation.status', label: 'Conversation Status' },
  { value: 'conversation.tags', label: 'Conversation Tags' },
  { value: 'conversation.assignedAgent', label: 'Assigned Agent' },
];

const operatorOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
}) => {
  const handleAddCondition = () => {
    onChange([
      ...conditions,
      {
        field: 'contact.name',
        operator: 'equals',
        value: '',
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (
    index: number,
    field: keyof AutomationCondition,
    value: any
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Add Conditions (Optional)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Define conditions that must be met for this automation to execute. All conditions must be satisfied.
        </p>
      </div>

      {conditions.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No conditions added. This automation will run for all trigger events.
          </p>
          <Button onClick={handleAddCondition} variant="secondary" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Condition
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Field Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Field
                    </label>
                    <Select
                      value={condition.field}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleConditionChange(index, 'field', e.target.value)
                      }
                      options={fieldOptions}
                    />
                  </div>

                  {/* Operator Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Operator
                    </label>
                    <Select
                      value={condition.operator}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleConditionChange(index, 'operator', e.target.value)
                      }
                      options={operatorOptions}
                    />
                  </div>

                  {/* Value Input */}
                  {needsValue(condition.operator) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Value
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter value..."
                        value={condition.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleConditionChange(index, 'value', e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                  className="mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {index < conditions.length - 1 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    AND
                  </span>
                </div>
              )}
            </Card>
          ))}

          <Button
            onClick={handleAddCondition}
            variant="secondary"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Condition
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConditionBuilder;
