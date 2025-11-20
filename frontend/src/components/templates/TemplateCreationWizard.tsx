import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Toast from '@/lib/toast-system';
import { WhatsAppPreview } from './wizard/preview/WhatsAppPreview';
import { TemplateWizardData } from './wizard/types';

// Step components
import { IdentityStep } from './wizard/steps/IdentityStep';
import { HeaderStep } from './wizard/steps/HeaderStep';
import { BodyFooterStep } from './wizard/steps/BodyFooterStep';
import { InteractionStep } from './wizard/steps/InteractionStep';
import { PersonalizationStep } from './wizard/steps/PersonalizationStep';
import { FinalizeStep } from './wizard/steps/FinalizeStep';

interface TemplateCreationWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
  template?: Template | null;
  mode?: 'create' | 'edit';
}

const STEPS = [
  { id: 1, label: 'Identity', key: 'identity' },
  { id: 2, label: 'Header', key: 'header' },
  { id: 3, label: 'Body & Footer', key: 'body-footer' },
  { id: 4, label: 'Actions', key: 'interaction' },
  { id: 5, label: 'Customize', key: 'personalization' },
  { id: 6, label: 'Launch', key: 'finalize' },
];

const TemplateCreationWizard: React.FC<TemplateCreationWizardProps> = ({
  onSuccess,
  onCancel,
  template = null,
  mode = 'create',
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!template;
  const [currentStep, setCurrentStep] = useState(1);

  const [wizardData, setWizardData] = useState<TemplateWizardData>({
    name: '',
    displayName: '',
    category: '',
    language: '',
    description: '',
    header: { type: 'none' },
    body: '',
    footer: '',
    buttons: [],
    variables: {},
  });

  useEffect(() => {
    if (template && isEditMode) {
      const templateAny = template as any;
      setWizardData({
        name: template.name,
        displayName: templateAny.displayName || '',
        category: template.category,
        language: template.language,
        description: templateAny.description || '',
        header: templateAny.components?.header || { type: 'none' },
        body: templateAny.components?.body?.text || template.content || '',
        footer: templateAny.components?.footer?.text || templateAny.footer || '',
        buttons: templateAny.components?.buttons || templateAny.buttons || [],
        variables: templateAny.sampleValues || {},
      });
    }
  }, [template, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: any) => templatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Template creation error:', error.response?.data);
      const errorData = error.response?.data;
      
      // Show detailed validation errors if available
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((err: any) => {
          Toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        Toast.error(errorData?.message || 'Failed to create template');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => templatesService.updateTemplate(template!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Template update error:', error.response?.data);
      const errorData = error.response?.data;
      
      // Show detailed validation errors if available
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((err: any) => {
          Toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        Toast.error(errorData?.message || 'Failed to update template');
      }
    },
  });

  const updateData = (data: Partial<TemplateWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.name && wizardData.category && wizardData.language;
      case 2:
        // Header step - optional, always can proceed
        if (wizardData.header.type === 'TEXT') {
          return wizardData.header.text && wizardData.header.text.length > 0;
        }
        return true;
      case 3:
        // Body & Footer step - body is required
        return wizardData.body.length > 0;
      case 4:
        return true;
      case 5:
        const placeholders = wizardData.body.match(/\{\{\d+\}\}/g) || [];
        return placeholders.every((p) => {
          const index = p.match(/\d+/)?.[0];
          return index && wizardData.variables[index];
        });
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Left Arrow = Back
      if (e.altKey && e.key === 'ArrowLeft' && currentStep > 1 && !isLoading) {
        e.preventDefault();
        handleBack();
      }
      // Alt + Right Arrow = Next (if can proceed)
      if (e.altKey && e.key === 'ArrowRight' && currentStep < STEPS.length && canProceed() && !isLoading) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isLoading]);

  const handleSubmit = () => {
    // Extract placeholder numbers from body text
    const placeholders = wizardData.body.match(/\{\{\d+\}\}/g) || [];
    const placeholderNumbers = placeholders.map(p => p.match(/\d+/)?.[0] || '').filter(Boolean);
    const uniquePlaceholders = [...new Set(placeholderNumbers)];

    // Only include variables that have corresponding placeholders in the body text
    const filteredVariables = Object.fromEntries(
      Object.entries(wizardData.variables).filter(([index, value]) => {
        return uniquePlaceholders.includes(index) && value && value.trim() !== '';
      })
    );

    // Build components object
    const components: any = {
      body: {
        text: wizardData.body,
        placeholders: Object.entries(filteredVariables)
          .map(([index, example]) => ({
            index: parseInt(index),
            example,
          })),
      },
    };

    // Only add header if it's not 'none'
    if (wizardData.header.type !== 'none') {
      components.header = wizardData.header;
    }

    // Only add footer if it exists
    if (wizardData.footer && wizardData.footer.trim()) {
      components.footer = { text: wizardData.footer };
    }

    // Only add buttons if there are any
    if (wizardData.buttons.length > 0) {
      components.buttons = wizardData.buttons;
    }

    const apiData = {
      name: wizardData.name,
      displayName: wizardData.displayName,
      category: wizardData.category,
      language: wizardData.language,
      description: wizardData.description,
      components,
      sampleValues: filteredVariables,
    };

    console.log('Submitting template data:', JSON.stringify(apiData, null, 2));
    console.log('Placeholders in body:', uniquePlaceholders);
    console.log('Variables before filtering:', wizardData.variables);
    console.log('Variables after filtering:', filteredVariables);

    if (isEditMode) {
      updateMutation.mutate(apiData);
    } else {
      createMutation.mutate(apiData);
    }
  };

  const renderStep = () => {
    const stepProps = {
      data: wizardData,
      updateData,
      onNext: handleNext,
    };

    switch (currentStep) {
      case 1:
        return <IdentityStep {...stepProps} />;
      case 2:
        return <HeaderStep {...stepProps} />;
      case 3:
        return <BodyFooterStep {...stepProps} />;
      case 4:
        return <InteractionStep {...stepProps} />;
      case 5:
        return <PersonalizationStep {...stepProps} />;
      case 6:
        return (
          <FinalizeStep
            {...stepProps}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/10 dark:to-purple-900/10 px-8 py-6 border-b border-primary-100 dark:border-primary-800">
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            Create New Template
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Step {currentStep} of {STEPS.length} - {STEPS[currentStep - 1].label}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((step) => (
            <div key={step.id} className="flex-1">
              <div className="relative">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step.id < currentStep
                      ? 'bg-primary-600'
                      : step.id === currentStep
                      ? 'bg-primary-400'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
                {step.id < currentStep && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 right-0 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex items-center justify-between mt-3">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`text-xs font-medium transition-colors ${
                step.id === currentStep 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="space-y-3 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            {/* Keyboard Shortcuts Hint */}
            <div className="flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">Alt</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">←</kbd>
                <span className="ml-1">Back</span>
              </span>
              <span className="mx-3">•</span>
              <span className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">Alt</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">→</kbd>
                <span className="ml-1">Next</span>
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              {/* Back Button */}
              <Button
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
                variant="outline"
                className="border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {/* Next/Submit Button */}
              <div className="flex items-center gap-3">
                {currentStep < STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || isLoading}
                    className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-success-600 to-emerald-600 hover:from-success-700 hover:to-emerald-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEditMode ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {isEditMode ? 'Update Template' : 'Create Template'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
              Live Preview
            </div>
            <WhatsAppPreview data={wizardData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCreationWizard;
