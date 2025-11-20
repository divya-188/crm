/**
 * Template Feedback Demo Component
 * 
 * This component demonstrates all the user feedback features:
 * - Success/Error/Warning/Info toast notifications
 * - Loading states and overlays
 * - Progress indicators for multi-step operations
 * - Confirmation dialogs for destructive actions
 * - Optimistic UI updates
 * 
 * This is a reference implementation showing best practices for user feedback.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Trash2,
  Send,
  Upload,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import ProgressIndicator, { ProgressStep } from '@/components/ui/ProgressIndicator';
import toast from '@/lib/toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useLoadingState } from '@/hooks/useLoadingState';
import { withTemplateFeedback } from '@/lib/template-feedback';

const TemplateFeedbackDemo: React.FC = () => {
  const { dialogState, showConfirm, hideConfirm, handleConfirm } = useConfirmDialog();
  const { isLoading, message, startLoading, stopLoading, updateMessage } = useLoadingState();
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Progress steps example
  const progressSteps: ProgressStep[] = [
    {
      id: 'validate',
      label: 'Validating Template',
      description: 'Checking template structure and content',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'active' : 'pending',
    },
    {
      id: 'upload',
      label: 'Uploading Media',
      description: 'Uploading header images and documents',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
    },
    {
      id: 'submit',
      label: 'Submitting to Meta',
      description: 'Sending template to WhatsApp Business API',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
    },
    {
      id: 'complete',
      label: 'Complete',
      description: 'Template submitted successfully',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending',
    },
  ];

  // Toast notification examples
  const handleShowSuccessToast = () => {
    toast.success('Template created successfully', 'Success');
  };

  const handleShowErrorToast = () => {
    toast.error('Failed to create template. Please check your input.', 'Error');
  };

  const handleShowWarningToast = () => {
    toast.warning('Template has validation warnings. Review before submitting.', 'Warning');
  };

  const handleShowInfoToast = () => {
    toast.info('Template is pending approval. This may take up to 24 hours.', 'Info');
  };

  // Promise toast example
  const handlePromiseToast = async () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Success!') : reject(new Error('Failed!'));
      }, 2000);
    });

    toast.promise(
      promise,
      {
        loading: 'Processing template...',
        success: 'Template processed successfully',
        error: 'Failed to process template',
      }
    );
  };

  // Template-specific feedback example
  const handleTemplateOperation = async () => {
    await withTemplateFeedback(
      'create',
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { name: 'order_confirmation' };
      },
      ['order_confirmation']
    );
  };

  // Confirmation dialog examples
  const handleDeleteWithConfirm = () => {
    showConfirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Template deleted successfully');
      },
    });
  };

  const handleWarningConfirm = () => {
    showConfirm({
      title: 'Submit Template',
      message: 'This template has validation warnings. Are you sure you want to submit it?',
      confirmText: 'Submit Anyway',
      cancelText: 'Review',
      variant: 'warning',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Template submitted for approval');
      },
    });
  };

  // Loading overlay example
  const handleLoadingOverlay = async () => {
    startLoading('Creating template...');
    
    setTimeout(() => updateMessage('Validating template...'), 1000);
    setTimeout(() => updateMessage('Uploading media...'), 2000);
    setTimeout(() => updateMessage('Submitting to Meta...'), 3000);
    setTimeout(() => {
      stopLoading();
      toast.success('Template created successfully');
    }, 4000);
  };

  // Progress indicator example
  const handleProgressDemo = () => {
    setShowProgress(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 3) {
          clearInterval(interval);
          setTimeout(() => {
            setShowProgress(false);
            toast.success('Template submitted successfully');
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          User Feedback System Demo
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Comprehensive examples of all user feedback components and patterns
        </p>
      </div>

      {/* Toast Notifications */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Toast Notifications
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Show contextual feedback messages for user actions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={handleShowSuccessToast}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-success-600" />
            Success
          </Button>
          <Button
            onClick={handleShowErrorToast}
            variant="outline"
            className="flex items-center gap-2"
          >
            <XCircle className="w-4 h-4 text-danger-600" />
            Error
          </Button>
          <Button
            onClick={handleShowWarningToast}
            variant="outline"
            className="flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-warning-600" />
            Warning
          </Button>
          <Button
            onClick={handleShowInfoToast}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Info className="w-4 h-4 text-blue-600" />
            Info
          </Button>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button
            onClick={handlePromiseToast}
            variant="outline"
            className="w-full"
          >
            Promise Toast (Random Success/Error)
          </Button>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button
            onClick={handleTemplateOperation}
            variant="primary"
            className="w-full"
          >
            Template Operation with Auto Feedback
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialogs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Confirmation Dialogs
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Confirm destructive or important actions before proceeding
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleDeleteWithConfirm}
            variant="outline"
            className="flex items-center gap-2 text-danger-600 hover:text-danger-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete Template (Danger)
          </Button>
          <Button
            onClick={handleWarningConfirm}
            variant="outline"
            className="flex items-center gap-2 text-warning-600 hover:text-warning-700"
          >
            <Send className="w-4 h-4" />
            Submit with Warnings
          </Button>
        </div>
      </Card>

      {/* Loading States */}
      <Card className="p-6 relative">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Loading Overlays
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Show loading states during async operations
        </p>
        <Button
          onClick={handleLoadingOverlay}
          variant="primary"
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Trigger Loading Overlay
        </Button>

        <LoadingOverlay
          isLoading={isLoading}
          message={message}
        />
      </Card>

      {/* Progress Indicators */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Progress Indicators
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Show multi-step operation progress
        </p>
        
        {!showProgress ? (
          <Button
            onClick={handleProgressDemo}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Start Multi-Step Submission
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <ProgressIndicator
              steps={progressSteps}
              currentStep={currentStep}
              orientation="vertical"
            />
          </motion.div>
        )}
      </Card>

      {/* Best Practices */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Best Practices
        </h2>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Always show success feedback after user actions</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Use loading states for operations taking more than 300ms</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Confirm destructive actions (delete, archive) with dialogs</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Show progress indicators for multi-step operations</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Use optimistic updates for better perceived performance</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Provide clear error messages with actionable suggestions</span>
          </li>
        </ul>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={hideConfirm}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
      />
    </div>
  );
};

export default TemplateFeedbackDemo;
