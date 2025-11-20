import { motion } from 'framer-motion';
import { Check, AlertCircle, Sparkles, Send } from 'lucide-react';
import { StepProps } from '../types';

interface FinalizeStepProps extends StepProps {
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function FinalizeStep({ data, onSubmit, isSubmitting }: FinalizeStepProps) {
  const placeholders = data.body.match(/\{\{\d+\}\}/g) || [];
  
  const checks = [
    {
      label: 'Template name is valid',
      passed: data.name.length > 0 && /^[a-z0-9_]+$/.test(data.name),
      required: true,
    },
    {
      label: 'Category selected',
      passed: !!data.category,
      required: true,
    },
    {
      label: 'Language selected',
      passed: !!data.language,
      required: true,
    },
    {
      label: 'Message body provided',
      passed: data.body.length > 0 && data.body.length <= 1024,
      required: true,
    },
    {
      label: 'All variables have examples',
      passed: placeholders.every(p => {
        const num = p.match(/\d+/)?.[0];
        return num && data.variables[num];
      }),
      required: placeholders.length > 0,
    },
    {
      label: 'Header configured',
      passed: data.header.type !== 'none',
      required: false,
    },
    {
      label: 'Footer added',
      passed: !!data.footer,
      required: false,
    },
    {
      label: 'Buttons configured',
      passed: data.buttons.length > 0,
      required: false,
    },
  ];

  const requiredChecks = checks.filter(c => c.required);
  const optionalChecks = checks.filter(c => !c.required);
  const allRequiredPassed = requiredChecks.every(c => c.passed);
  const completionScore = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Finalize & Submit</h3>
        <p className="text-neutral-600">Review your template before submitting to Meta for approval</p>
      </div>

      {/* Completion Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90 mb-1">Completion Score</div>
            <div className="text-4xl font-bold">{completionScore}%</div>
          </div>
          <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center">
            <Sparkles className="w-12 h-12" />
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-white"
          />
        </div>
      </motion.div>

      {/* Required Checks */}
      <div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Required Items</h4>
        <div className="space-y-2">
          {requiredChecks.map((check, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                check.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                check.passed ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {check.passed ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-white" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                check.passed ? 'text-green-900' : 'text-red-900'
              }`}>
                {check.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Optional Enhancements */}
      <div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Optional Enhancements</h4>
        <div className="space-y-2">
          {optionalChecks.map((check, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (requiredChecks.length + index) * 0.05 }}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                check.passed ? 'bg-primary-50 border border-primary-200' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                check.passed ? 'bg-primary-500' : 'bg-gray-300'
              }`}>
                {check.passed && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className={`text-sm font-medium ${
                check.passed ? 'text-primary-900' : 'text-neutral-600'
              }`}>
                {check.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Template Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-neutral-50 border border-neutral-200 rounded-xl p-6"
      >
        <h4 className="font-semibold text-neutral-900 mb-4">Template Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-neutral-600 mb-1">Name</div>
            <div className="font-medium text-neutral-900">{data.name || 'Not set'}</div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Category</div>
            <div className="font-medium text-neutral-900">{data.category || 'Not set'}</div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Language</div>
            <div className="font-medium text-neutral-900">{data.language || 'Not set'}</div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Variables</div>
            <div className="font-medium text-neutral-900">{placeholders.length}</div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Header</div>
            <div className="font-medium text-neutral-900">
              {data.header.type === 'none' ? 'None' : data.header.type}
            </div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Buttons</div>
            <div className="font-medium text-neutral-900">{data.buttons.length}</div>
          </div>
        </div>
      </motion.div>

      {/* Submission Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4"
      >
        <h4 className="font-semibold text-yellow-900 mb-2">📋 What Happens Next?</h4>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li className="flex items-start space-x-2">
            <span className="font-bold">1.</span>
            <span>Your template will be submitted to Meta for review</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">2.</span>
            <span>Review typically takes 1-24 hours (up to 48 hours for complex templates)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">3.</span>
            <span>You'll receive a notification when approved or if changes are needed</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">4.</span>
            <span>Once approved, you can start using it in your campaigns</span>
          </li>
        </ul>
      </motion.div>

      {/* Submit Button */}
      {!allRequiredPassed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Cannot Submit Yet</h4>
              <p className="text-sm text-red-800">
                Please complete all required items before submitting your template.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
