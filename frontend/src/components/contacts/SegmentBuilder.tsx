import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { ContactSegmentCriteria, SegmentCondition } from '@/types/models.types';
import { fadeInUp } from '@/lib/motion-variants';

interface SegmentBuilderProps {
  criteria: ContactSegmentCriteria;
  onChange: (criteria: ContactSegmentCriteria) => void;
  previewCount?: number;
  onPreview?: () => void;
}

const FIELD_OPTIONS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Notes' },
  { value: 'lastContactedAt', label: 'Last Contacted' },
  { value: 'createdAt', label: 'Created Date' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
];

export const SegmentBuilder = ({
  criteria,
  onChange,
  previewCount,
  onPreview,
}: SegmentBuilderProps) => {
  const [localCriteria, setLocalCriteria] = useState<ContactSegmentCriteria>(criteria);

  useEffect(() => {
    setLocalCriteria(criteria);
  }, [criteria]);

  const handleLogicChange = (logic: 'AND' | 'OR') => {
    const updated = { ...localCriteria, logic };
    setLocalCriteria(updated);
    onChange(updated);
  };

  const handleAddCondition = () => {
    const newCondition: SegmentCondition = {
      field: 'firstName',
      operator: 'equals',
      value: '',
    };
    const updated = {
      ...localCriteria,
      conditions: [...localCriteria.conditions, newCondition],
    };
    setLocalCriteria(updated);
    onChange(updated);
  };

  const handleRemoveCondition = (index: number) => {
    const updated = {
      ...localCriteria,
      conditions: localCriteria.conditions.filter((_, i) => i !== index),
    };
    setLocalCriteria(updated);
    onChange(updated);
  };

  const handleConditionChange = (index: number, field: keyof SegmentCondition, value: any) => {
    const updated = {
      ...localCriteria,
      conditions: localCriteria.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    };
    setLocalCriteria(updated);
    onChange(updated);
  };

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  const isListOperator = (operator: string) => {
    return ['in', 'not_in'].includes(operator);
  };

  return (
    <div className="space-y-4">
      {/* Logic Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Match contacts where
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={localCriteria.logic === 'AND' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleLogicChange('AND')}
          >
            ALL
          </Button>
          <Button
            type="button"
            variant={localCriteria.logic === 'OR' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleLogicChange('OR')}
          >
            ANY
          </Button>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          of the following conditions are true:
        </span>
      </div>

      {/* Conditions */}
      <div className="space-y-3">
        <AnimatePresence>
          {localCriteria.conditions.map((condition, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Field */}
                    <Select
                      value={condition.field}
                      onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                      options={FIELD_OPTIONS}
                    />

                    {/* Operator */}
                    <Select
                      value={condition.operator}
                      onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                      options={OPERATOR_OPTIONS}
                    />

                    {/* Value */}
                    {needsValue(condition.operator) && (
                      <div>
                        {isListOperator(condition.operator) ? (
                          <Input
                            type="text"
                            placeholder="Enter values separated by commas"
                            value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                            onChange={(e) => {
                              const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                              handleConditionChange(index, 'value', values.length > 0 ? values : '');
                            }}
                            required
                          />
                        ) : condition.field === 'tags' ? (
                          <Input
                            type="text"
                            placeholder="Enter tag name"
                            value={condition.value}
                            onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                            required
                          />
                        ) : (
                          <Input
                            type="text"
                            placeholder="Enter value"
                            value={condition.value}
                            onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                            required
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCondition(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Condition Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCondition}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Condition
        </Button>
      </div>

      {/* Preview */}
      {onPreview && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Matching Contacts:
            </span>
            {previewCount !== undefined ? (
              <Badge variant="primary" className="text-lg px-3 py-1">
                {previewCount}
              </Badge>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Click preview to calculate
              </span>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onPreview}>
            Preview
          </Button>
        </div>
      )}
    </div>
  );
};
