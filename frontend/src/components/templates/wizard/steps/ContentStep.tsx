import { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Hash, AlertCircle, Lightbulb } from 'lucide-react';
import { StepProps } from '../types';
import Textarea from '@/components/ui/Textarea';

const MAX_BODY_LENGTH = 1024;

export function ContentStep({ data, updateData }: StepProps) {
  const [showTips, setShowTips] = useState(true);
  
  const bodyLength = data.body.length;
  const placeholders = data.body.match(/\{\{\d+\}\}/g) || [];
  const isNearLimit = bodyLength > MAX_BODY_LENGTH * 0.8;

  const insertPlaceholder = () => {
    const existingPlaceholders = data.body.match(/\{\{\d+\}\}/g) || [];
    const nextIndex = existingPlaceholders.length + 1;
    updateData({ body: data.body + `{{${nextIndex}}}` });
  };

  const validatePlaceholders = () => {
    const issues = [];
    
    // Check for sequential numbering
    const numbers = placeholders.map(p => parseInt(p.match(/\d+/)?.[0] || '0'));
    const sorted = [...numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] !== i + 1) {
        issues.push(`Placeholders must be sequential (found {{${sorted[i]}}}, expected {{${i + 1}}})`);
        break;
      }
    }

    // Check for stacked placeholders
    if (/\{\{\d+\}\}\{\{\d+\}\}/.test(data.body)) {
      issues.push('Placeholders cannot be stacked without separators');
    }

    // Check for leading/trailing placeholders
    if (/^\{\{\d+\}\}/.test(data.body.trim())) {
      issues.push('Message should not start with a placeholder');
    }
    if (/\{\{\d+\}\}$/.test(data.body.trim())) {
      issues.push('Message should not end with a placeholder');
    }

    return issues;
  };

  const issues = validatePlaceholders();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Content</h3>
        <p className="text-gray-600">Write the main message your customers will receive</p>
      </div>

      {/* Tips Banner */}
      {showTips && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Pro Tips</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Keep it concise and clear (under 800 characters recommended)</li>
                <li>• Use placeholders like {`{{1}}, {{2}}`} for dynamic content</li>
                <li>• Start with a greeting and end with a call-to-action</li>
                <li>• Emojis are allowed and can increase engagement 🎉</li>
              </ul>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Message Body */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Message Body *
          </label>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Type className="w-4 h-4 text-gray-400" />
              <span className={`font-medium ${isNearLimit ? 'text-orange-600' : 'text-gray-600'}`}>
                {bodyLength} / {MAX_BODY_LENGTH}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-600">
                {placeholders.length} {placeholders.length === 1 ? 'variable' : 'variables'}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Textarea
            value={data.body}
            onChange={(e) => updateData({ body: e.target.value })}
            placeholder="Hi {{1}}, your order {{2}} has been confirmed! 🎉&#10;&#10;We'll deliver it to {{3}} by {{4}}.&#10;&#10;Thank you for choosing us!"
            rows={12}
            maxLength={MAX_BODY_LENGTH}
            className="font-mono text-base"
          />
          
          {/* Insert Placeholder Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={insertPlaceholder}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-medium shadow-sm hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <Hash className="w-4 h-4" />
            <span>Insert Variable</span>
          </motion.button>
        </div>

        {/* Character Count Warning */}
        {isNearLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-sm text-orange-600 mt-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Approaching character limit. Consider keeping it shorter for better engagement.</span>
          </motion.div>
        )}
      </motion.div>

      {/* Validation Issues */}
      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-2">Validation Issues</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Placeholder Guide */}
      {placeholders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-4"
        >
          <h4 className="font-semibold text-gray-900 mb-3">Detected Variables</h4>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((placeholder, index) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-mono text-sm text-gray-700"
              >
                {placeholder}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            You'll provide example values for these in the Personalization step
          </p>
        </motion.div>
      )}
    </div>
  );
}
