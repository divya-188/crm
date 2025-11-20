import { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Hash, AlertCircle, Lightbulb, MessageSquare } from 'lucide-react';
import { StepProps } from '../types';
import Textarea from '@/components/ui/Textarea';
import Input from '@/components/ui/Input';

const MAX_BODY_LENGTH = 1024;
const MAX_FOOTER_LENGTH = 60;

export function BodyFooterStep({ data, updateData }: StepProps) {
  const [showTips, setShowTips] = useState(true);
  
  const bodyLength = data.body.length;
  const footerLength = data.footer?.length || 0;
  const placeholders = data.body.match(/\{\{\d+\}\}/g) || [];
  const isBodyNearLimit = bodyLength > MAX_BODY_LENGTH * 0.8;
  const isFooterNearLimit = footerLength > MAX_FOOTER_LENGTH * 0.8;

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
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Body & Footer</h3>
        <p className="text-neutral-600">Write your main message and add an optional footer</p>
      </div>

      {/* Tips Banner */}
      {showTips && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 mb-2">Content Tips</h4>
              <ul className="text-sm text-neutral-700 space-y-1">
                <li>• Keep body concise and clear (under 800 characters recommended)</li>
                <li>• Use placeholders like {`{{1}}, {{2}}`} for dynamic content</li>
                <li>• Start with a greeting and end with a call-to-action</li>
                <li>• Emojis are allowed and can increase engagement 🎉</li>
                <li>• Footer is great for disclaimers or brand info</li>
              </ul>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-neutral-400 hover:text-neutral-600"
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
          <label className="block text-sm font-semibold text-neutral-700 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Message Body *</span>
          </label>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Type className="w-4 h-4 text-neutral-400" />
              <span className={`font-medium ${isBodyNearLimit ? 'text-orange-600' : 'text-neutral-600'}`}>
                {bodyLength} / {MAX_BODY_LENGTH}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Hash className="w-4 h-4 text-neutral-400" />
              <span className="font-medium text-neutral-600">
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
          />
          
          {/* Insert Placeholder Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={insertPlaceholder}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white border-2 border-primary-500 text-primary-600 rounded-lg font-medium shadow-sm hover:bg-primary-50 transition-colors flex items-center space-x-2"
          >
            <Hash className="w-4 h-4" />
            <span>Insert Variable</span>
          </motion.button>
        </div>

        {/* Character Count Warning */}
        {isBodyNearLimit && (
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
          className="bg-neutral-50 border border-neutral-200 rounded-xl p-4"
        >
          <h4 className="font-semibold text-neutral-900 mb-3">Detected Variables</h4>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((placeholder, index) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg font-mono text-sm text-neutral-700"
              >
                {placeholder}
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-600 mt-3">
            You'll provide example values for these in the Personalization step
          </p>
        </motion.div>
      )}

      {/* Footer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-6 border-t border-neutral-200"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-neutral-700">
            Footer (Optional)
          </label>
          <span className={`text-sm font-medium ${isFooterNearLimit ? 'text-orange-600' : 'text-neutral-600'}`}>
            {footerLength} / {MAX_FOOTER_LENGTH}
          </span>
        </div>
        <Input
          value={data.footer || ''}
          onChange={(e) => updateData({ footer: e.target.value })}
          placeholder="© 2024 YourBrand | Reply STOP to unsubscribe"
          maxLength={MAX_FOOTER_LENGTH}
        />
        <p className="mt-2 text-xs text-neutral-500">
          Footer appears in gray text at the bottom. Great for disclaimers, brand info, or opt-out instructions.
        </p>
      </motion.div>
    </div>
  );
}
