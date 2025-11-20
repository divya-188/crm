import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Send,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileCheck,
  Eye,
  Sparkles,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import { templatesService } from '@/services/templates.service';
import { ValidationPanel } from '../validation/ValidationPanel';
import { QualityScoreIndicator } from '../validation/QualityScoreIndicator';
import { TemplatePreview } from '../preview/TemplatePreview';
import { cn } from '@/lib/utils';
import toast from '@/lib/toast';

interface SubmissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (template: any) => void;
}

type WizardStep = 'review' | 'validate' | 'submit';

interface StepConfig {
  id: WizardStep;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const steps: StepConfig[] = [
  {
    id: 'review',
    title: 'Review Template',
    description: 'Review your template content and preview',
    icon: Eye,
  },
  {
    id: 'validate',
    title: 'Validation Check',
    description: 'Ensure template meets all requirements',
    icon: FileCheck,
  },
  {
    id: 'submit',
    title: 'Submit for Approval',
    description: 'Submit to Meta for approval',
    icon: Send,
  },
];

/**
 * SubmissionWizard Component
 * 
 * Multi-step wizard for submitting templates to Meta for approval:
 * - Step 1: Review template content and preview
 * - Step 2: Final validation check
 * - Step 3: Submit to Meta API
 * 
 * Features:
 * - Multi-step flow with progress indicator
 * - Final validation before submission
 * - Error handling with user-friendly messages
 * - Success feedback with next steps
 * - Prevents submission if validation fails
 * 
 * Requirements: 7.1, 7.2, 7.7
 */
export const SubmissionWizard: React.FC<SubmissionWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    templateId,
    name,
    displayName,
    category,
    language,
    description,
    components,
    sampleValues,
    validationErrors,
    qualityScore,
  } = useTemplateEditorStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedTemplate, setSubmittedTemplate] = useState<any>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('review');
      setIsSubmitting(false);
      setIsValidating(false);
      setSubmissionError(null);
      setSubmissionSuccess(false);
      setSubmittedTemplate(null);
    }
  }, [isOpen]);

  // Get current step index
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 'review') {
      return true; // Can always proceed from review
    }
    if (currentStep === 'validate') {
      return validationErrors.length === 0; // Must have no errors to proceed
    }
    return false;
  };

  // Handle next step
  const handleNext = async () => {
    if (currentStep === 'review') {
      setCurrentStep('validate');
    } else if (currentStep === 'validate') {
      // Run final validation before moving to submit
      setIsValidating(true);
      try {
        // Validation is already done in real-time, but we can trigger a final check
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate validation
        
        if (validationErrors.length === 0) {
          setCurrentStep('submit');
        } else {
          toast.error('Please fix all validation errors before submitting');
        }
      } finally {
        setIsValidating(false);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep === 'validate') {
      setCurrentStep('review');
    } else if (currentStep === 'submit') {
      setCurrentStep('validate');
    }
  };

  // Handle template submission
  const handleSubmit = async () => {
    if (!templateId) {
      toast.error('Template ID is missing');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Submit template to Meta API
      const result = await templatesService.submitTemplate(templateId);
      
      setSubmittedTemplate(result);
      setSubmissionSuccess(true);
      
      toast.success('Template submitted successfully!');
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to submit template. Please try again.';
      
      setSubmissionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (submissionSuccess) {
      // If submission was successful, close and refresh
      onClose();
    } else if (isSubmitting) {
      // Don't allow closing during submission
      return;
    } else {
      // Confirm close if in middle of wizard
      if (currentStep !== 'review') {
        const confirmed = window.confirm(
          'Are you sure you want to cancel the submission process?'
        );
        if (!confirmed) return;
      }
      onClose();
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'review':
        return (
          <div className="space-y-6">
            {/* Template Info Summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Template Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium text-gray-900">{name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Display Name:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {displayName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <Badge variant="primary" size="sm" className="ml-2">
                    {category}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Language:</span>
                  <span className="ml-2 font-medium text-gray-900">{language}</span>
                </div>
              </div>
              {description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-600 text-sm">Description:</span>
                  <p className="mt-1 text-sm text-gray-900">{description}</p>
                </div>
              )}
            </div>

            {/* Template Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Template Preview
              </h3>
              <TemplatePreview />
            </div>

            {/* Quality Score */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quality Assessment
              </h3>
              <QualityScoreIndicator />
            </div>

            {/* Important Notice */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900">
                    Before You Submit
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Review your template content carefully</li>
                    <li>Ensure all placeholders have sample values</li>
                    <li>Check that your template follows Meta's policies</li>
                    <li>Templates typically take 1-2 hours for approval</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'validate':
        return (
          <div className="space-y-6">
            {/* Validation Status */}
            <div className={cn(
              'rounded-lg border p-4',
              validationErrors.length === 0
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            )}>
              <div className="flex items-center space-x-3">
                {validationErrors.length === 0 ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-900">
                        Validation Passed
                      </h3>
                      <p className="text-sm text-green-700 mt-0.5">
                        Your template meets all requirements and is ready for submission
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-900">
                        Validation Failed
                      </h3>
                      <p className="text-sm text-red-700 mt-0.5">
                        Please fix the following errors before submitting
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Validation Details */}
            <ValidationPanel />

            {/* Quality Score */}
            {validationErrors.length === 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Final Quality Check
                </h3>
                <QualityScoreIndicator />
              </div>
            )}
          </div>
        );

      case 'submit':
        if (submissionSuccess) {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Template Submitted Successfully!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Your template has been submitted to Meta for approval.
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  What happens next?
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-600 font-bold">1.</span>
                    <span>
                      Meta will review your template (typically 1-2 hours)
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-600 font-bold">2.</span>
                    <span>
                      You'll receive a notification when the status changes
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-600 font-bold">3.</span>
                    <span>
                      Once approved, you can start using the template in messages
                    </span>
                  </li>
                </ul>
              </div>

              {submittedTemplate && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        Template Details
                      </h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <Badge variant="warning" size="sm" className="ml-1">
                            {submittedTemplate.status}
                          </Badge>
                        </div>
                        {submittedTemplate.metaTemplateId && (
                          <div>
                            <span className="font-medium">Meta Template ID:</span>{' '}
                            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                              {submittedTemplate.metaTemplateId}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Submission Confirmation */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Ready to Submit
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                You're about to submit this template to Meta for approval. Please confirm
                that:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>All template content is accurate and complete</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Sample values represent realistic use cases</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Template complies with Meta's WhatsApp policies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Category selection is appropriate for your use case</span>
                </li>
              </ul>
            </div>

            {/* Template Summary */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Template Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Template Name:</span>
                  <span className="font-medium text-gray-900">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <Badge variant="primary" size="sm">{category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium text-gray-900">{language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quality Score:</span>
                  <span className={cn(
                    'font-semibold',
                    (qualityScore ?? 0) >= 80 ? 'text-green-600' :
                    (qualityScore ?? 0) >= 60 ? 'text-blue-600' :
                    (qualityScore ?? 0) >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  )}>
                    {qualityScore ?? 0}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {submissionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900">
                      Submission Failed
                    </h4>
                    <p className="text-sm text-red-700 mt-1">{submissionError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for Marketing Category */}
            {category === 'MARKETING' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-900">
                      Marketing Category Notice
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Marketing templates have stricter approval requirements and may take
                      longer to review. Ensure your template provides clear value to
                      recipients.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Render footer buttons
  const renderFooter = () => {
    if (submissionSuccess) {
      return (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {currentStepIndex > 0 && (
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isSubmitting || isValidating}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>

          {currentStep !== 'submit' ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed() || isValidating}
              loading={isValidating}
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
            >
              {currentStep === 'validate' ? 'Proceed to Submit' : 'Next'}
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              icon={<Send className="h-4 w-4" />}
            >
              Submit Template
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      closeOnBackdropClick={!isSubmitting && !submissionSuccess}
      closeOnEscape={!isSubmitting}
      showCloseButton={!isSubmitting}
      title={submissionSuccess ? 'Submission Complete' : 'Submit Template for Approval'}
      description={
        submissionSuccess
          ? 'Your template has been submitted successfully'
          : 'Follow these steps to submit your template to Meta for approval'
      }
      footer={renderFooter()}
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        {!submissionSuccess && (
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                        isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : isActive
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : isAccessible
                          ? 'border-gray-300 bg-white text-gray-400'
                          : 'border-gray-200 bg-gray-100 text-gray-300'
                      )}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </motion.div>
                    <div className="mt-2 text-center">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isActive
                            ? 'text-primary-600'
                            : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-500'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 px-4 pb-8">
                      <div
                        className={cn(
                          'h-0.5 transition-colors',
                          index < currentStepIndex
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default SubmissionWizard;
