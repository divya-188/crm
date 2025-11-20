import React from 'react';
import { motion } from 'framer-motion';
import { Hash, AlertCircle, Sparkles } from 'lucide-react';
import { StepProps } from '../types';
import Input from '@/components/ui/Input';

export function PersonalizationStep({ data, updateData }: StepProps) {
  const placeholders = data.body.match(/\{\{\d+\}\}/g) || [];
  const placeholderNumbers = placeholders.map(p => p.match(/\d+/)?.[0] || '').filter(Boolean);

  // Clean up stale variables when component mounts or placeholders change
  React.useEffect(() => {
    const currentVariableKeys = Object.keys(data.variables);
    const hasStaleVariables = currentVariableKeys.some(key => !placeholderNumbers.includes(key));
    
    if (hasStaleVariables) {
      // Filter out variables that don't have corresponding placeholders
      const cleanedVariables = Object.fromEntries(
        Object.entries(data.variables).filter(([key]) => placeholderNumbers.includes(key))
      );
      updateData({ variables: cleanedVariables });
    }
  }, [placeholderNumbers.join(',')]);

  const updateVariable = (index: string, value: string) => {
    updateData({
      variables: {
        ...data.variables,
        [index]: value,
      },
    });
  };

  const allVariablesFilled = placeholderNumbers.every(num => data.variables[num]?.trim());

  const getSuggestion = (index: number): string => {
    const suggestions = [
      'John Smith',
      'Order #12345',
      '123 Main St, New York',
      'December 25, 2025',
      '$149.99',
      'Premium Plan',
      'john@example.com',
      '+1234567890',
    ];
    return suggestions[index - 1] || `Example ${index}`;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Personalization</h3>
        <p className="text-neutral-600">Provide example values for each variable in your message</p>
      </div>

      {placeholderNumbers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary-50 to-primary-50 border-2 border-primary-200 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
          <h4 className="text-xl font-bold text-neutral-900 mb-2">No Variables Detected</h4>
          <p className="text-neutral-600">
            Your message doesn't contain any placeholders. You can skip this step!
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-primary-200 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <Hash className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary-900 mb-1">Why Example Values Matter</h4>
                <p className="text-sm text-primary-800">
                  Meta reviews templates with your example data to understand context. 
                  Use realistic values that represent actual use cases.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-neutral-700">
                Variable Examples ({Object.keys(data.variables).filter(k => data.variables[k]).length}/{placeholderNumbers.length})
              </label>
              {allVariablesFilled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-1 text-green-600 text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>All set!</span>
                </motion.div>
              )}
            </div>

            {placeholderNumbers.map((num, index) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-r from-gray-50 to-white border border-neutral-200 rounded-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-white font-bold">{`{{${num}}}`}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-semibold text-neutral-700">
                      Variable {num} Example *
                    </label>
                    <Input
                      value={data.variables[num] || ''}
                      onChange={(e) => updateVariable(num, e.target.value)}
                      placeholder={getSuggestion(parseInt(num))}
                    />
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-neutral-500">
                        This will replace {`{{${num}}}`} in the preview
                      </span>
                      {!data.variables[num] && (
                        <button
                          type="button"
                          onClick={() => updateVariable(num, getSuggestion(parseInt(num)))}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Use suggestion
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Validation Warning */}
          {!allVariablesFilled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-50 border border-orange-200 rounded-xl p-4"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Missing Examples</h4>
                  <p className="text-sm text-orange-800">
                    Please provide example values for all variables before proceeding.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Best Practices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-primary-200 rounded-xl p-4"
          >
            <h4 className="font-semibold text-primary-900 mb-3">✨ Best Practices</h4>
            <ul className="text-sm text-primary-800 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Use realistic data that represents actual customer information</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Avoid dummy values like "XXXX" or "test123"</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Match the format you'll use in production (dates, currency, etc.)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>Keep examples professional and appropriate</span>
              </li>
            </ul>
          </motion.div>
        </>
      )}
    </div>
  );
}
