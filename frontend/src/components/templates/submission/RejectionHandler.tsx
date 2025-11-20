import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  XCircle,
  Edit3,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  Info,
  ExternalLink,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Template } from '@/types/models.types';

interface RejectionHandlerProps {
  template: Template;
  onEditAndResubmit: () => void;
  className?: string;
}

interface RejectionSuggestion {
  title: string;
  description: string;
  action?: string;
  component?: string;
}

interface RejectionKnowledgeItem {
  reason: string;
  category: string;
  description: string;
  commonCauses: string[];
  solutions: string[];
  examples: {
    wrong: string;
    correct: string;
  };
  metaDocUrl?: string;
}

/**
 * RejectionHandler Component
 * 
 * Displays rejection information and provides actionable guidance:
 * - Clear rejection reason display
 * - Actionable suggestions based on rejection type
 * - Edit and Resubmit button
 * - Rejection reason knowledge base modal
 * - Highlights problematic components
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.5, 9.6
 */
export const RejectionHandler: React.FC<RejectionHandlerProps> = ({
  template,
  onEditAndResubmit,
  className,
}) => {
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [selectedKnowledgeItem, setSelectedKnowledgeItem] = useState<RejectionKnowledgeItem | null>(null);

  // Parse rejection reason and generate suggestions
  const { suggestions, problematicComponents, knowledgeItem } = analyzeRejection(
    template.rejectionReason || ''
  );

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Main Rejection Alert */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border-2 border-red-300 bg-red-50 p-6"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-red-900">
                  Template Rejected by Meta
                </h3>
                <Badge variant="danger" size="sm">
                  REJECTED
                </Badge>
              </div>

              <p className="text-sm text-red-800 mb-4">
                Your template was reviewed by Meta and rejected. Please review the reason
                below and make the necessary changes before resubmitting.
              </p>

              {/* Rejection Reason */}
              <div className="rounded-lg border border-red-200 bg-white p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Rejection Reason:
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {template.rejectionReason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onEditAndResubmit}
                  icon={<Edit3 className="h-4 w-4" />}
                >
                  Edit and Resubmit
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowKnowledgeBase(true)}
                  icon={<HelpCircle className="h-4 w-4" />}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Problematic Components Highlight */}
        {problematicComponents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-orange-200 bg-orange-50 p-4"
          >
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900 mb-2">
                  Problematic Components
                </h4>
                <p className="text-sm text-orange-800 mb-3">
                  The following components may need attention:
                </p>
                <div className="space-y-2">
                  {problematicComponents.map((component, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm text-orange-900"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="font-medium">{component.name}:</span>
                      <span>{component.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actionable Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-blue-200 bg-blue-50 p-4"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Suggested Actions
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Follow these steps to fix the issues:
                </p>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-blue-200 bg-white p-3"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-900 mb-1">
                            {suggestion.title}
                          </h5>
                          <p className="text-sm text-gray-700 mb-2">
                            {suggestion.description}
                          </p>
                          {suggestion.component && (
                            <Badge variant="info" size="sm">
                              {suggestion.component}
                            </Badge>
                          )}
                          {suggestion.action && (
                            <p className="text-xs text-blue-600 mt-2 font-medium">
                              → {suggestion.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Knowledge Base Modal */}
      <AnimatePresence>
        {showKnowledgeBase && (
          <RejectionKnowledgeBaseModal
            knowledgeItem={knowledgeItem}
            onClose={() => {
              setShowKnowledgeBase(false);
              setSelectedKnowledgeItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Analyzes rejection reason and generates actionable suggestions
 */
function analyzeRejection(rejectionReason: string): {
  suggestions: RejectionSuggestion[];
  problematicComponents: Array<{ name: string; issue: string }>;
  knowledgeItem: RejectionKnowledgeItem | null;
} {
  const lowerReason = rejectionReason.toLowerCase();
  const suggestions: RejectionSuggestion[] = [];
  const problematicComponents: Array<{ name: string; issue: string }> = [];
  let knowledgeItem: RejectionKnowledgeItem | null = null;

  // Analyze for common rejection patterns
  if (lowerReason.includes('placeholder') || lowerReason.includes('variable')) {
    suggestions.push({
      title: 'Fix Placeholder Issues',
      description: 'Ensure all placeholders use the correct format {{1}}, {{2}}, etc. and are sequential.',
      action: 'Review body text and update placeholder formatting',
      component: 'Body',
    });
    problematicComponents.push({
      name: 'Body Text',
      issue: 'Invalid or non-sequential placeholders detected',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('placeholder')
    ) || null;
  }

  if (lowerReason.includes('category') || lowerReason.includes('wrong category')) {
    suggestions.push({
      title: 'Update Template Category',
      description: 'The template content doesn\'t match the selected category. Choose the correct category based on your message purpose.',
      action: 'Change category to match your template content',
      component: 'Basic Info',
    });
    problematicComponents.push({
      name: 'Category',
      issue: 'Selected category doesn\'t match template content',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('category')
    ) || null;
  }

  if (lowerReason.includes('spam') || lowerReason.includes('promotional') || lowerReason.includes('marketing')) {
    suggestions.push({
      title: 'Remove Spam Language',
      description: 'Remove aggressive marketing language like "Buy Now", "Limited Time", "Act Fast", etc.',
      action: 'Rewrite body text with more neutral, informative language',
      component: 'Body',
    });
    problematicComponents.push({
      name: 'Body Text',
      issue: 'Contains spam or overly promotional language',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('spam')
    ) || null;
  }

  if (lowerReason.includes('button') || lowerReason.includes('cta')) {
    suggestions.push({
      title: 'Fix Button Configuration',
      description: 'Check button types, text length (max 25 chars), and ensure you\'re not mixing Quick Reply with Call-To-Action buttons.',
      action: 'Review and update button configuration',
      component: 'Buttons',
    });
    problematicComponents.push({
      name: 'Buttons',
      issue: 'Invalid button configuration or text',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('button')
    ) || null;
  }

  if (lowerReason.includes('sample') || lowerReason.includes('example')) {
    suggestions.push({
      title: 'Update Sample Values',
      description: 'Provide realistic, appropriate sample values for all placeholders that match your template purpose.',
      action: 'Review and update all sample values',
      component: 'Sample Values',
    });
    problematicComponents.push({
      name: 'Sample Values',
      issue: 'Sample values are missing or inappropriate',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('sample')
    ) || null;
  }

  if (lowerReason.includes('policy') || lowerReason.includes('violation') || lowerReason.includes('prohibited')) {
    suggestions.push({
      title: 'Review Meta Policies',
      description: 'Your template may violate Meta\'s WhatsApp Business policies. Review the content for prohibited topics or sensitive data requests.',
      action: 'Remove any policy-violating content',
      component: 'All Components',
    });
    problematicComponents.push({
      name: 'Content',
      issue: 'May violate Meta WhatsApp Business policies',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('policy')
    ) || null;
  }

  if (lowerReason.includes('header') || lowerReason.includes('media')) {
    suggestions.push({
      title: 'Fix Header Component',
      description: 'Check header text length (max 60 chars) or media format/size requirements.',
      action: 'Update header text or re-upload media',
      component: 'Header',
    });
    problematicComponents.push({
      name: 'Header',
      issue: 'Header text too long or media format invalid',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE.find(item => 
      item.reason.toLowerCase().includes('header')
    ) || null;
  }

  // Generic suggestions if no specific pattern matched
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Review Template Content',
      description: 'Carefully review all template components against Meta\'s guidelines.',
      action: 'Check all components for compliance',
    });
    knowledgeItem = REJECTION_KNOWLEDGE_BASE[0]; // Default to first item
  }

  return { suggestions, problematicComponents, knowledgeItem };
}

/**
 * Rejection Knowledge Base Modal Component
 */
interface RejectionKnowledgeBaseModalProps {
  knowledgeItem: RejectionKnowledgeItem | null;
  onClose: () => void;
}

const RejectionKnowledgeBaseModal: React.FC<RejectionKnowledgeBaseModalProps> = ({
  knowledgeItem,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredKnowledge = selectedCategory === 'all'
    ? REJECTION_KNOWLEDGE_BASE
    : REJECTION_KNOWLEDGE_BASE.filter(item => item.category === selectedCategory);

  const categories = Array.from(
    new Set(REJECTION_KNOWLEDGE_BASE.map(item => item.category))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Rejection Reason Knowledge Base
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Common rejection reasons and how to fix them
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {filteredKnowledge.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-4',
                  knowledgeItem?.reason === item.reason
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {item.reason}
                    </h3>
                    <Badge variant="info" size="sm" className="mt-1">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{item.description}</p>

                {/* Common Causes */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Common Causes:
                  </h4>
                  <ul className="space-y-1">
                    {item.commonCauses.map((cause, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Solutions */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    How to Fix:
                  </h4>
                  <ul className="space-y-1">
                    {item.solutions.map((solution, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-900 mb-1">❌ Wrong:</p>
                    <p className="text-xs text-red-700 font-mono">{item.examples.wrong}</p>
                  </div>
                  <div className="rounded border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-medium text-green-900 mb-1">✓ Correct:</p>
                    <p className="text-xs text-green-700 font-mono">{item.examples.correct}</p>
                  </div>
                </div>

                {/* Meta Documentation Link */}
                {item.metaDocUrl && (
                  <a
                    href={item.metaDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <span>Read Meta Documentation</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Rejection Knowledge Base Data
 */
const REJECTION_KNOWLEDGE_BASE: RejectionKnowledgeItem[] = [
  {
    reason: 'Invalid Placeholder Format',
    category: 'Placeholders',
    description: 'Placeholders must use the correct format and be sequential.',
    commonCauses: [
      'Using {1} instead of {{1}}',
      'Using {{name}} instead of {{1}}',
      'Non-sequential numbering like {{1}}, {{3}}',
      'Stacked placeholders without separators: {{1}}{{2}}',
    ],
    solutions: [
      'Use double curly braces: {{1}}, {{2}}, {{3}}',
      'Ensure sequential numbering starting from 1',
      'Add separators between placeholders',
      'Remove leading/trailing placeholders',
    ],
    examples: {
      wrong: 'Hello {1}, your order {{name}} is ready',
      correct: 'Hello {{1}}, your order {{2}} is ready',
    },
    metaDocUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates',
  },
  {
    reason: 'Wrong Category Selected',
    category: 'Category',
    description: 'Template content doesn\'t match the selected category.',
    commonCauses: [
      'Marketing content in TRANSACTIONAL category',
      'Order updates in MARKETING category',
      'OTP messages in UTILITY category',
    ],
    solutions: [
      'Use TRANSACTIONAL for order updates, shipping notifications',
      'Use MARKETING for promotional content (requires opt-in)',
      'Use UTILITY for account updates, reminders',
      'Use OTP for one-time passwords only',
    ],
    examples: {
      wrong: 'TRANSACTIONAL: Buy now! 50% off sale!',
      correct: 'MARKETING: Special offer: 50% off for our valued customers',
    },
    metaDocUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components',
  },
  {
    reason: 'Spam or Promotional Language',
    category: 'Content',
    description: 'Template contains aggressive marketing or spam language.',
    commonCauses: [
      'Using "Buy Now", "Click Here", "Limited Time"',
      'Excessive use of capital letters or exclamation marks',
      'Misleading or clickbait content',
    ],
    solutions: [
      'Use neutral, informative language',
      'Avoid urgency tactics and pressure language',
      'Be clear and honest about your message',
      'Focus on value, not aggressive selling',
    ],
    examples: {
      wrong: 'BUY NOW!!! LIMITED TIME OFFER!!! CLICK HERE!!!',
      correct: 'We have a special offer available for you. View details.',
    },
  },
  {
    reason: 'Invalid Button Configuration',
    category: 'Buttons',
    description: 'Button setup doesn\'t follow Meta\'s requirements.',
    commonCauses: [
      'Mixing Quick Reply with Call-To-Action buttons',
      'Button text exceeds 25 characters',
      'More than 3 Quick Reply or 2 CTA buttons',
      'Duplicate button text',
    ],
    solutions: [
      'Use either Quick Reply OR Call-To-Action, not both',
      'Keep button text under 25 characters',
      'Limit to 3 Quick Reply or 2 CTA buttons',
      'Ensure unique button text',
    ],
    examples: {
      wrong: 'Button: "Click here to view your order details now"',
      correct: 'Button: "View Order"',
    },
  },
  {
    reason: 'Missing or Invalid Sample Values',
    category: 'Sample Values',
    description: 'Sample values are missing, inappropriate, or unrealistic.',
    commonCauses: [
      'Using placeholder text like "example" or "test"',
      'Sample values don\'t match template purpose',
      'Missing sample values for placeholders',
    ],
    solutions: [
      'Provide realistic sample values',
      'Match sample values to template context',
      'Ensure all placeholders have samples',
      'Use appropriate data for your business',
    ],
    examples: {
      wrong: 'Sample: "test", "example", "xxx"',
      correct: 'Sample: "John Smith", "Order #12345", "$99.99"',
    },
  },
  {
    reason: 'Policy Violation',
    category: 'Policy',
    description: 'Template violates Meta\'s WhatsApp Business policies.',
    commonCauses: [
      'Requesting sensitive data (credit card, SSN, password)',
      'Prohibited content (adult, gambling, weapons)',
      'Misleading or deceptive content',
    ],
    solutions: [
      'Never request sensitive personal information',
      'Avoid prohibited topics and industries',
      'Be transparent and honest',
      'Review Meta\'s commerce and business policies',
    ],
    examples: {
      wrong: 'Please reply with your credit card number',
      correct: 'Click the secure link to complete payment',
    },
    metaDocUrl: 'https://www.whatsapp.com/legal/commerce-policy',
  },
  {
    reason: 'Header Issues',
    category: 'Header',
    description: 'Header component has formatting or content issues.',
    commonCauses: [
      'Header text exceeds 60 characters',
      'More than 1 placeholder in header',
      'Invalid media format or size',
    ],
    solutions: [
      'Keep header text under 60 characters',
      'Use maximum 1 placeholder in header',
      'Use supported media formats (JPEG, PNG for images)',
      'Ensure media files are under size limits',
    ],
    examples: {
      wrong: 'Header: "Welcome {{1}} to our amazing store with great deals {{2}}"',
      correct: 'Header: "Welcome {{1}}"',
    },
  },
  {
    reason: 'Character Limit Exceeded',
    category: 'Content',
    description: 'Template component exceeds character limits.',
    commonCauses: [
      'Body text over 1024 characters',
      'Footer text over 60 characters',
      'Header text over 60 characters',
    ],
    solutions: [
      'Keep body text under 1024 characters',
      'Keep footer under 60 characters',
      'Keep header under 60 characters',
      'Be concise and clear',
    ],
    examples: {
      wrong: 'Footer: "Reply STOP to unsubscribe from all future communications and marketing messages"',
      correct: 'Footer: "Reply STOP to unsubscribe"',
    },
  },
];

export default RejectionHandler;
