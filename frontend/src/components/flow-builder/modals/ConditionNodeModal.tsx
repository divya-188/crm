import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import VariablePicker from '../VariablePicker';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConditionNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConditionNodeData) => void;
  initialData?: ConditionNodeData;
}

export interface ConditionRule {
  variable: string;
  operator: string;
  value: string;
}

export interface ConditionNodeData {
  label?: string;
  logic: 'AND' | 'OR';
  rules: ConditionRule[];
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const ConditionNodeModal: React.FC<ConditionNodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [label, setLabel] = useState(initialData?.label || 'Condition');
  const [logic, setLogic] = useState<'AND' | 'OR'>(initialData?.logic || 'AND');
  const [rules, setRules] = useState<ConditionRule[]>(
    initialData?.rules || [{ variable: '', operator: 'equals', value: '' }]
  );

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || 'Condition');
      setLogic(initialData.logic || 'AND');
      setRules(initialData.rules || [{ variable: '', operator: 'equals', value: '' }]);
    }
  }, [initialData]);

  const handleAddRule = () => {
    setRules([...rules, { variable: '', operator: 'equals', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleRuleChange = (
    index: number,
    field: keyof ConditionRule,
    value: string
  ) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleVariableSelect = (index: number, variable: string) => {
    handleRuleChange(index, 'variable', variable);
  };

  const handleSave = () => {
    // Validate that all rules have at least a variable and operator
    const isValid = rules.every(
      (rule) =>
        rule.variable.trim() &&
        rule.operator &&
        (rule.operator === 'is_empty' ||
          rule.operator === 'is_not_empty' ||
          rule.value.trim())
    );

    if (!isValid) {
      return;
    }

    onSave({
      label: label.trim() || 'Condition',
      logic,
      rules,
    });
    onClose();
  };

  const handleCancel = () => {
    setLabel(initialData?.label || 'Condition');
    setLogic(initialData?.logic || 'AND');
    setRules(initialData?.rules || [{ variable: '', operator: 'equals', value: '' }]);
    onClose();
  };

  const isValid = rules.every(
    (rule) =>
      rule.variable.trim() &&
      rule.operator &&
      (rule.operator === 'is_empty' ||
        rule.operator === 'is_not_empty' ||
        rule.value.trim())
  );

  const needsValue = (operator: string) => {
    return operator !== 'is_empty' && operator !== 'is_not_empty';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Configure Condition Node"
      description="Set conditions to branch the flow based on user data or input"
      size="xl"
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
            placeholder="e.g., Check User Type"
          />
        </div>

        {/* Logic Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Logic Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLogic('AND')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                logic === 'AND'
                  ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="font-semibold">AND</div>
              <div className="text-xs text-neutral-600 mt-1">
                All conditions must be true
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLogic('OR')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                logic === 'OR'
                  ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="font-semibold">OR</div>
              <div className="text-xs text-neutral-600 mt-1">
                At least one condition must be true
              </div>
            </button>
          </div>
        </div>

        {/* Condition Rules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700">
              Conditions
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {rules.map((rule, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      {/* Variable */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Variable
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={rule.variable}
                            onChange={(e) =>
                              handleRuleChange(index, 'variable', e.target.value)
                            }
                            placeholder="e.g., {{contact.name}}"
                            className="flex-1"
                          />
                          <VariablePicker
                            onSelect={(variable) =>
                              handleVariableSelect(index, variable)
                            }
                            placeholder="Pick"
                          />
                        </div>
                      </div>

                      {/* Operator */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Operator
                        </label>
                        <Select
                          value={rule.operator}
                          onChange={(e) =>
                            handleRuleChange(index, 'operator', e.target.value)
                          }
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Value */}
                      {needsValue(rule.operator) && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Value
                          </label>
                          <Input
                            value={rule.value}
                            onChange={(e) =>
                              handleRuleChange(index, 'value', e.target.value)
                            }
                            placeholder="Enter comparison value"
                          />
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6"
                        title="Remove condition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Logic Connector */}
                  {index < rules.length - 1 && (
                    <div className="flex items-center justify-center mt-3">
                      <span className="px-3 py-1 bg-secondary-100 text-secondary-700 text-xs font-semibold rounded-full">
                        {logic}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Preview
          </label>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <GitBranch className="w-5 h-5 text-secondary-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 mb-2">
                  {label || 'Condition'}
                </div>
                <div className="text-sm text-neutral-600 space-y-1">
                  {rules.map((rule, index) => (
                    <div key={index}>
                      <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                        {rule.variable || '(variable)'}{' '}
                        {operators.find((op) => op.value === rule.operator)?.label.toLowerCase() || rule.operator}{' '}
                        {needsValue(rule.operator) && (rule.value || '(value)')}
                      </span>
                      {index < rules.length - 1 && (
                        <span className="mx-2 text-secondary-600 font-semibold">
                          {logic}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-200">
                  <span className="text-xs text-success-600 font-medium">
                    ✓ True Path
                  </span>
                  <span className="text-xs text-danger-600 font-medium">
                    ✗ False Path
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-secondary-900 mb-2">
            💡 Tips
          </h4>
          <ul className="text-sm text-secondary-800 space-y-1">
            <li>• Use AND when all conditions must be met</li>
            <li>• Use OR when any condition can trigger the path</li>
            <li>• Variables can reference contact fields or previous inputs</li>
            <li>• Connect both True and False outputs for complete flows</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ConditionNodeModal;
