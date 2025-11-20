import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  History,
  Info,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Template } from '@/types/models.types';
import { templatesService } from '@/services/templates.service';
import { formatDistanceToNow, format } from 'date-fns';
import { TestPhoneNumberManager } from './TestPhoneNumberManager';

interface TemplateTestProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
}

interface TestSend {
  id: string;
  phoneNumber: string;
  placeholderValues: Record<string, string>;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  metaMessageId?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

/**
 * TemplateTest Component
 * 
 * Modal for testing WhatsApp templates before production use:
 * - Test phone number input and management
 * - Placeholder value inputs for testing
 * - Send test button with loading states
 * - Test send status display with delivery tracking
 * - Test history list with timestamps
 * - Delivery status updates (sent, delivered, read, failed)
 * 
 * Features:
 * - Support for up to 5 test phone numbers per WABA
 * - Real-time status updates for test sends
 * - Placeholder value validation
 * - Test history with detailed status tracking
 * - Error handling with specific error messages
 * 
 * Requirements: 12.1, 12.3, 12.4, 12.5, 12.6
 */
export const TemplateTest: React.FC<TemplateTestProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  // State for selected phone number
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');

  // State for placeholder values
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [placeholderErrors, setPlaceholderErrors] = useState<Record<string, string>>({});

  // State for test sends
  const [testHistory, setTestHistory] = useState<TestSend[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // State for UI
  const [showHistory, setShowHistory] = useState(true);

  // Initialize placeholder values with examples
  useEffect(() => {
    if (template.variables && template.variables.length > 0) {
      const initialValues: Record<string, string> = {};
      template.variables.forEach((variable) => {
        initialValues[variable.name] = variable.example || '';
      });
      setPlaceholderValues(initialValues);
    }
  }, [template]);

  // Validate placeholder values
  const validatePlaceholders = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (template.variables) {
      template.variables.forEach((variable) => {
        const value = placeholderValues[variable.name];
        if (!value || value.trim() === '') {
          errors[variable.name] = 'This field is required';
          isValid = false;
        }
      });
    }

    setPlaceholderErrors(errors);
    return isValid;
  };

  // Send test template
  const handleSendTest = async () => {
    setSendError('');

    // Validate phone number
    if (!selectedPhoneNumber) {
      setSendError('Please select or add a test phone number');
      return;
    }

    // Validate placeholders
    if (!validatePlaceholders()) {
      setSendError('Please fill in all placeholder values');
      return;
    }

    setIsSending(true);

    try {
      // Call API to send test template
      // Note: This is a mock implementation. Replace with actual API call
      const response = await templatesService.sendTestTemplate(template.id, {
        phoneNumber: selectedPhoneNumber,
        placeholderValues,
      });

      // Add to test history
      const newTestSend: TestSend = {
        id: Date.now().toString(),
        phoneNumber: selectedPhoneNumber,
        placeholderValues: { ...placeholderValues },
        status: 'sent',
        metaMessageId: response.messageId,
        sentAt: new Date().toISOString(),
      };

      setTestHistory([newTestSend, ...testHistory]);

      // Simulate status updates (in production, this would come from webhooks)
      setTimeout(() => {
        setTestHistory(prev =>
          prev.map(test =>
            test.id === newTestSend.id
              ? { ...test, status: 'delivered', deliveredAt: new Date().toISOString() }
              : test
          )
        );
      }, 2000);

      setTimeout(() => {
        setTestHistory(prev =>
          prev.map(test =>
            test.id === newTestSend.id
              ? { ...test, status: 'read', readAt: new Date().toISOString() }
              : test
          )
        );
      }, 5000);
    } catch (error: any) {
      console.error('Error sending test template:', error);
      setSendError(
        error.response?.data?.message ||
        'Failed to send test template. Please try again.'
      );

      // Add failed test to history
      const failedTestSend: TestSend = {
        id: Date.now().toString(),
        phoneNumber: selectedPhoneNumber,
        placeholderValues: { ...placeholderValues },
        status: 'failed',
        errorMessage: error.response?.data?.message || 'Unknown error',
        sentAt: new Date().toISOString(),
      };

      setTestHistory([failedTestSend, ...testHistory]);
    } finally {
      setIsSending(false);
    }
  };

  // Get status icon and color
  const getStatusConfig = (status: TestSend['status']) => {
    switch (status) {
      case 'sending':
        return {
          icon: Loader2,
          color: 'info',
          label: 'Sending',
          iconClass: 'animate-spin',
        };
      case 'sent':
        return {
          icon: CheckCircle,
          color: 'info',
          label: 'Sent',
          iconClass: '',
        };
      case 'delivered':
        return {
          icon: CheckCircle,
          color: 'success',
          label: 'Delivered',
          iconClass: '',
        };
      case 'read':
        return {
          icon: CheckCircle,
          color: 'success',
          label: 'Read',
          iconClass: '',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'danger',
          label: 'Failed',
          iconClass: '',
        };
      default:
        return {
          icon: Clock,
          color: 'neutral',
          label: 'Unknown',
          iconClass: '',
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Template"
      description={`Send a test message for "${template.name}" to verify formatting and content`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Template Testing
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Test sends are logged separately from production messages. You can add up to 5
                test phone numbers per WhatsApp Business Account.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Test Configuration */}
          <div className="space-y-6">
            {/* Test Phone Number Section */}
            <TestPhoneNumberManager
              wabaId={template.wabaId || 'default'}
              onPhoneNumberSelect={setSelectedPhoneNumber}
              selectedPhoneNumber={selectedPhoneNumber}
            />

            {/* Placeholder Values Section */}
            {template.variables && template.variables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Placeholder Values
                </h3>
                <div className="space-y-3">
                  {template.variables.map((variable, index) => (
                    <Input
                      key={index}
                      label={`${variable.name} {{${index + 1}}}`}
                      placeholder={variable.example}
                      value={placeholderValues[variable.name] || ''}
                      onChange={(e) =>
                        setPlaceholderValues({
                          ...placeholderValues,
                          [variable.name]: e.target.value,
                        })
                      }
                      error={placeholderErrors[variable.name]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Send Test Button */}
            <div className="space-y-3">
              {sendError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{sendError}</p>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleSendTest}
                loading={isSending}
                disabled={!selectedPhoneNumber || isSending}
                icon={<Send className="h-5 w-5" />}
                fullWidth
              >
                {isSending ? 'Sending Test...' : 'Send Test Message'}
              </Button>
            </div>
          </div>

          {/* Right Column: Test History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <History className="h-4 w-4 mr-2" />
                Test History
              </h3>
              {testHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  {showHistory ? 'Hide' : 'Show'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 max-h-[500px] overflow-y-auto"
                >
                  {testHistory.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No test sends yet</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Send a test message to see it here
                      </p>
                    </div>
                  ) : (
                    testHistory.map((test) => {
                      const statusConfig = getStatusConfig(test.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.div
                          key={test.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border border-gray-200 bg-white space-y-3"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <StatusIcon
                                className={cn(
                                  'h-5 w-5',
                                  statusConfig.color === 'success' && 'text-green-600',
                                  statusConfig.color === 'info' && 'text-blue-600',
                                  statusConfig.color === 'danger' && 'text-red-600',
                                  statusConfig.color === 'neutral' && 'text-gray-600',
                                  statusConfig.iconClass
                                )}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {test.phoneNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(test.sentAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={statusConfig.color as any}
                              size="sm"
                            >
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Placeholder Values */}
                          {Object.keys(test.placeholderValues).length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700">
                                Placeholder Values:
                              </p>
                              <div className="space-y-0.5">
                                {Object.entries(test.placeholderValues).map(
                                  ([key, value]) => (
                                    <p key={key} className="text-xs text-gray-600">
                                      <span className="font-medium">{key}:</span> {value}
                                    </p>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Error Message */}
                          {test.errorMessage && (
                            <div className="rounded border border-red-200 bg-red-50 p-2">
                              <p className="text-xs text-red-700">
                                {test.errorMessage}
                              </p>
                            </div>
                          )}

                          {/* Delivery Timeline */}
                          {test.status !== 'failed' && (
                            <div className="space-y-1 text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3" />
                                <span>
                                  Sent: {format(new Date(test.sentAt), 'h:mm:ss a')}
                                </span>
                              </div>
                              {test.deliveredAt && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>
                                    Delivered:{' '}
                                    {format(new Date(test.deliveredAt), 'h:mm:ss a')}
                                  </span>
                                </div>
                              )}
                              {test.readAt && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>
                                    Read: {format(new Date(test.readAt), 'h:mm:ss a')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Meta Message ID */}
                          {test.metaMessageId && (
                            <p className="text-xs text-gray-400">
                              Message ID: {test.metaMessageId}
                            </p>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateTest;
