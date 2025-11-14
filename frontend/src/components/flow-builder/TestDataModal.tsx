import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Play } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (testData: Record<string, any>) => void;
}

const TestDataModal: React.FC<TestDataModalProps> = ({
  isOpen,
  onClose,
  onStartTest,
}) => {
  const [testVariables, setTestVariables] = useState<
    Array<{ key: string; value: string }>
  >([{ key: '', value: '' }]);

  const addVariable = () => {
    setTestVariables([...testVariables, { key: '', value: '' }]);
  };

  const removeVariable = (index: number) => {
    setTestVariables(testVariables.filter((_, i) => i !== index));
  };

  const updateVariable = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updated = [...testVariables];
    updated[index][field] = value;
    setTestVariables(updated);
  };

  const handleStartTest = () => {
    const testData: Record<string, any> = {};
    testVariables.forEach((variable) => {
      if (variable.key.trim()) {
        // Try to parse as JSON, otherwise use as string
        try {
          testData[variable.key] = JSON.parse(variable.value);
        } catch {
          testData[variable.key] = variable.value;
        }
      }
    });
    onStartTest(testData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Test Flow Execution
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Provide test data to simulate flow execution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700">
              Test Variables
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={addVariable}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Variable
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testVariables.map((variable, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="outlined" padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        label="Variable Name"
                        placeholder="e.g., userName"
                        value={variable.key}
                        onChange={(e) =>
                          updateVariable(index, 'key', e.target.value)
                        }
                      />
                      <Input
                        label="Value"
                        placeholder="e.g., John Doe"
                        value={variable.value}
                        onChange={(e) =>
                          updateVariable(index, 'value', e.target.value)
                        }
                      />
                    </div>
                    {testVariables.length > 1 && (
                      <button
                        onClick={() => removeVariable(index)}
                        className="mt-7 p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card variant="outlined" padding="sm" className="bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Variable names should match those used in your flow nodes</li>
                <li>Values can be text, numbers, or JSON objects</li>
                <li>Leave empty to use default test values</li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStartTest}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Start Test
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TestDataModal;
