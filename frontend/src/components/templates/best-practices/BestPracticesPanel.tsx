import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Shield,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Badge from '@/components/ui/Badge';

interface BestPractice {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  importance: 'high' | 'medium' | 'low';
}

interface ExampleTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  preview: string;
}

interface PolicyGuideline {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  link?: string;
}

export const BestPracticesPanel: React.FC = () => {
  const {
    category,
    components,
    activeComponent,
  } = useTemplateEditorStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['checklist', 'contextual'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Generate contextual tips based on active component
  const contextualTips = useMemo(() => {
    const tips: Array<{ icon: React.ReactNode; title: string; description: string }> = [];

    switch (activeComponent) {
      case 'basic':
        tips.push(
          {
            icon: <FileText className="h-5 w-5 text-blue-600" />,
            title: 'Template Naming',
            description: 'Use lowercase letters, numbers, and underscores only. Example: order_confirmation_v1',
          },
          {
            icon: <Sparkles className="h-5 w-5 text-primary-600" />,
            title: 'Category Selection',
            description: `${category === 'MARKETING' ? 'Marketing templates have stricter approval requirements. Ensure your content provides clear value.' : 'Choose the category that best matches your use case for faster approval.'}`,
          }
        );
        break;

      case 'header':
        tips.push(
          {
            icon: <ImageIcon className="h-5 w-5 text-green-600" />,
            title: 'Header Media',
            description: 'Use high-quality images (JPEG/PNG, max 5MB) or videos (MP4, max 16MB). Ensure media is relevant to your message.',
          },
          {
            icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
            title: 'Text Headers',
            description: 'Keep headers concise (max 60 chars). Use only 1 placeholder if needed. Headers should grab attention.',
          }
        );
        break;

      case 'body':
        tips.push(
          {
            icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
            title: 'Body Text Best Practices',
            description: 'Keep messages clear and concise (max 1024 chars). Use placeholders for personalization but avoid excessive use (max 5 recommended).',
          },
          {
            icon: <Sparkles className="h-5 w-5 text-primary-600" />,
            title: 'Placeholder Usage',
            description: 'Use sequential numbering {{1}}, {{2}}, etc. Avoid stacking placeholders without separators. Don\'t start or end with placeholders.',
          }
        );
        break;

      case 'footer':
        tips.push(
          {
            icon: <FileText className="h-5 w-5 text-gray-600" />,
            title: 'Footer Guidelines',
            description: 'Use footers for disclaimers, unsubscribe info, or company details (max 60 chars). No placeholders allowed in footers.',
          }
        );
        break;

      case 'buttons':
        tips.push(
          {
            icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
            title: 'Button Configuration',
            description: 'Use clear, action-oriented text (max 25 chars). Don\'t mix Quick Reply with Call-to-Action buttons. Max 3 Quick Reply or 2 CTA buttons.',
          },
          {
            icon: <Sparkles className="h-5 w-5 text-primary-600" />,
            title: 'Button Text',
            description: 'Make button text specific and actionable. Examples: "View Order", "Contact Support", "Yes, Confirm".',
          }
        );
        break;

      default:
        tips.push(
          {
            icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
            title: 'General Tips',
            description: 'Review all components before submission. Use the preview to see how your template will appear to customers.',
          }
        );
    }

    return tips;
  }, [activeComponent, category]);

  // Best practices checklist
  const bestPracticesChecklist: BestPractice[] = useMemo(() => {
    const hasBody = components.body?.text && components.body.text.length > 0;
    const bodyLength = components.body?.text?.length || 0;
    const placeholderCount = (components.body?.text?.match(/\{\{\d+\}\}/g) || []).length;
    const hasFooter = components.footer?.text && components.footer.text.length > 0;
    const hasButtons = components.buttons && components.buttons.length > 0;
    const hasDescription = useTemplateEditorStore.getState().description?.length > 0;

    return [
      {
        id: 'body-length',
        title: 'Body text is concise (50-800 characters)',
        description: 'Optimal length for readability and engagement',
        isCompleted: bodyLength >= 50 && bodyLength <= 800,
        importance: 'high',
      },
      {
        id: 'placeholder-limit',
        title: 'Limited placeholders (5 or fewer)',
        description: 'Too many placeholders can reduce approval chances',
        isCompleted: placeholderCount <= 5,
        importance: 'high',
      },
      {
        id: 'has-footer',
        title: 'Includes footer for context',
        description: 'Footers improve quality score and provide additional info',
        isCompleted: hasFooter,
        importance: 'medium',
      },
      {
        id: 'has-description',
        title: 'Template has description',
        description: 'Helps team members understand template purpose',
        isCompleted: hasDescription,
        importance: 'medium',
      },
      {
        id: 'has-buttons',
        title: 'Includes interactive buttons',
        description: 'Buttons improve engagement and user experience',
        isCompleted: hasButtons,
        importance: 'low',
      },
      {
        id: 'no-spam-words',
        title: 'Avoids spam language',
        description: 'No "buy now", "limited time", "act fast", etc.',
        isCompleted: !/(buy now|limited time|act fast|click here)/i.test(components.body?.text || ''),
        importance: 'high',
      },
    ];
  }, [components]);

  // Example templates by category
  const exampleTemplates: ExampleTemplate[] = useMemo(() => {
    const examples: Record<string, ExampleTemplate[]> = {
      TRANSACTIONAL: [
        {
          id: 'order-confirmation',
          category: 'TRANSACTIONAL',
          name: 'Order Confirmation',
          description: 'Confirm order details with tracking info',
          preview: 'Hi {{1}}, your order #{{2}} has been confirmed! Track it here: {{3}}',
        },
        {
          id: 'payment-receipt',
          category: 'TRANSACTIONAL',
          name: 'Payment Receipt',
          description: 'Send payment confirmation',
          preview: 'Payment of ${{1}} received for invoice #{{2}}. Thank you!',
        },
      ],
      UTILITY: [
        {
          id: 'appointment-reminder',
          category: 'UTILITY',
          name: 'Appointment Reminder',
          description: 'Remind customers of upcoming appointments',
          preview: 'Reminder: Your appointment with {{1}} is scheduled for {{2}}.',
        },
        {
          id: 'status-update',
          category: 'UTILITY',
          name: 'Status Update',
          description: 'Provide status updates on requests',
          preview: 'Your request #{{1}} status has been updated to: {{2}}',
        },
      ],
      MARKETING: [
        {
          id: 'product-launch',
          category: 'MARKETING',
          name: 'Product Launch',
          description: 'Announce new products',
          preview: 'Introducing {{1}}! Discover our latest innovation designed for you.',
        },
        {
          id: 'special-offer',
          category: 'MARKETING',
          name: 'Special Offer',
          description: 'Share promotional offers',
          preview: 'Exclusive for you: {{1}}% off on {{2}}. Valid until {{3}}.',
        },
      ],
      ACCOUNT_UPDATE: [
        {
          id: 'password-reset',
          category: 'ACCOUNT_UPDATE',
          name: 'Password Reset',
          description: 'Send password reset instructions',
          preview: 'Reset your password using this code: {{1}}. Valid for 10 minutes.',
        },
        {
          id: 'profile-update',
          category: 'ACCOUNT_UPDATE',
          name: 'Profile Update',
          description: 'Confirm profile changes',
          preview: 'Your {{1}} has been updated successfully.',
        },
      ],
      OTP: [
        {
          id: 'verification-code',
          category: 'OTP',
          name: 'Verification Code',
          description: 'Send one-time passwords',
          preview: 'Your verification code is: {{1}}. Do not share this code.',
        },
        {
          id: 'login-otp',
          category: 'OTP',
          name: 'Login OTP',
          description: 'Two-factor authentication code',
          preview: '{{1}} is your login code. Valid for 5 minutes.',
        },
      ],
    };

    return examples[category] || [];
  }, [category]);

  // Policy guidelines
  const policyGuidelines: PolicyGuideline[] = [
    {
      id: 'no-sensitive-data',
      title: 'Never Request Sensitive Information',
      description: 'Do not ask for credit card numbers, CVV, passwords, PINs, or social security numbers in templates.',
      severity: 'error',
      link: 'https://developers.facebook.com/docs/whatsapp/message-templates/guidelines',
    },
    {
      id: 'no-spam',
      title: 'Avoid Spam Language',
      description: 'Avoid aggressive marketing language like "Buy now!", "Limited time!", "Act fast!", or "Click here!".',
      severity: 'warning',
    },
    {
      id: 'clear-purpose',
      title: 'Clear Message Purpose',
      description: 'Templates should have a clear, legitimate business purpose. Avoid vague or misleading content.',
      severity: 'warning',
    },
    {
      id: 'opt-out',
      title: 'Provide Opt-Out Options',
      description: 'For marketing messages, include clear opt-out instructions (e.g., "Reply STOP to unsubscribe").',
      severity: 'info',
    },
    {
      id: 'accurate-category',
      title: 'Use Correct Category',
      description: 'Select the category that accurately reflects your message type. Misclassification can lead to rejection.',
      severity: 'warning',
    },
    {
      id: 'quality-content',
      title: 'High-Quality Content',
      description: 'Use proper grammar, spelling, and formatting. Avoid excessive capitalization or special characters.',
      severity: 'info',
    },
  ];

  const completedCount = bestPracticesChecklist.filter((p) => p.isCompleted).length;
  const totalCount = bestPracticesChecklist.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      {/* Contextual Tips */}
      <CollapsibleSection
        id="contextual"
        title="Contextual Tips"
        icon={<Lightbulb className="h-5 w-5 text-yellow-500" />}
        isExpanded={expandedSections.has('contextual')}
        onToggle={() => toggleSection('contextual')}
      >
        <div className="space-y-3">
          {contextualTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 rounded-lg bg-blue-50 p-3"
            >
              <div className="flex-shrink-0 mt-0.5">{tip.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">{tip.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{tip.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Best Practices Checklist */}
      <CollapsibleSection
        id="checklist"
        title="Best Practices Checklist"
        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        isExpanded={expandedSections.has('checklist')}
        onToggle={() => toggleSection('checklist')}
        badge={
          <Badge
            variant={completionPercentage === 100 ? 'success' : completionPercentage >= 50 ? 'warning' : 'default'}
          >
            {completedCount}/{totalCount}
          </Badge>
        }
      >
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Completion</span>
              <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  completionPercentage === 100
                    ? 'bg-green-500'
                    : completionPercentage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          {bestPracticesChecklist.map((practice) => (
            <div
              key={practice.id}
              className={`flex items-start space-x-3 rounded-lg p-3 transition-colors ${
                practice.isCompleted ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {practice.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4
                    className={`text-sm font-medium ${
                      practice.isCompleted ? 'text-green-900' : 'text-gray-900'
                    }`}
                  >
                    {practice.title}
                  </h4>
                  {practice.importance === 'high' && (
                    <Badge variant="danger" size="sm">
                      Important
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{practice.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Example Templates */}
      {exampleTemplates.length > 0 && (
        <CollapsibleSection
          id="examples"
          title="Example Templates"
          icon={<BookOpen className="h-5 w-5 text-primary-500" />}
          isExpanded={expandedSections.has('examples')}
          onToggle={() => toggleSection('examples')}
        >
          <div className="space-y-3">
            {exampleTemplates.map((example) => (
              <div
                key={example.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{example.name}</h4>
                  <Badge variant="default" size="sm">
                    {example.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                <div className="rounded bg-gray-50 p-3 border border-gray-200">
                  <p className="text-sm text-gray-700 font-mono">{example.preview}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Policy Guidelines */}
      <CollapsibleSection
        id="policies"
        title="Policy Guidelines"
        icon={<Shield className="h-5 w-5 text-red-500" />}
        isExpanded={expandedSections.has('policies')}
        onToggle={() => toggleSection('policies')}
      >
        <div className="space-y-3">
          {policyGuidelines.map((guideline) => (
            <div
              key={guideline.id}
              className={`flex items-start space-x-3 rounded-lg p-3 ${
                guideline.severity === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : guideline.severity === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {guideline.severity === 'error' ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : guideline.severity === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium ${
                    guideline.severity === 'error'
                      ? 'text-red-900'
                      : guideline.severity === 'warning'
                      ? 'text-yellow-900'
                      : 'text-blue-900'
                  }`}
                >
                  {guideline.title}
                </h4>
                <p
                  className={`mt-1 text-sm ${
                    guideline.severity === 'error'
                      ? 'text-red-700'
                      : guideline.severity === 'warning'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}
                >
                  {guideline.description}
                </p>
                {guideline.link && (
                  <a
                    href={guideline.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <span>Learn more</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Meta Policy Updates */}
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 border border-primary-200">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-primary-900 mb-1">
              Stay Updated with Meta Policies
            </h4>
            <p className="text-sm text-primary-700 mb-3">
              WhatsApp template policies are regularly updated. Review the latest guidelines to ensure compliance.
            </p>
            <a
              href="https://developers.facebook.com/docs/whatsapp/message-templates/guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <span>View Meta's Template Guidelines</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  badge,
  children,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-gray-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BestPracticesPanel;
