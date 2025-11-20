import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import toast from '@/lib/toast';

// Step Components
import { IdentityStep } from './steps/IdentityStep';
import { ContentStep } from './steps/ContentStep';
import { EnrichmentStep } from './steps/EnrichmentStep';
import { InteractionStep } from './steps/InteractionStep';
import { PersonalizationStep } from './steps/PersonalizationStep';
import { FinalizeStep } from './steps/FinalizeStep';

// Preview Component
import { WhatsAppPreview } from './preview/WhatsAppPreview';

// Types
import { TemplateWizardData } from './types';

interface TemplateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
}

const STEPS = [
  { id: 'identity', label: 'Identity', icon: '🎯', description: 'Name & classify your template' },
  { id: 'content', label: 'Content', icon: '✍️', description: 'Craft your message' },
  { id: 'enrichment', label: 'Enrichment', icon: '🎨', description: 'Add header & footer' },
  { id: 'interaction', label: 'Interaction', icon: '🔘', description: 'Add action buttons' },
  { id: 'personalization', label: 'Personalization', icon: '🎭', description: 'Define variables' },
  { id: 'finalize', label: 'Finalize', icon: '🚀', description: 'Review & submit' },
];

export function TemplateWizard({ isOpen, onClose, template }: TemplateWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
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
    if (template) {
      // Load existing template data
      setWizardData({
        name: template.name,
        displayName: template.displayName || '',
        category: template.category,
        language: template.language,
        description: template.description || '',
        header: template.components?.header || { type: 'none' },
        body: template.components?.body?.text || template.content || '',
        footer: template.components?.footer?.text || template.footer || '',
        buttons: template.components?.buttons || template.buttons || [],
        variables: template.sampleValues || {},
      });
    }
  }, [template]);

  const createMutation = useMutation({
    mutationFn: (data: any) => templatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('🎉 Template created successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  const updateData = (data: Partial<TemplateWizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Identity
        return wizardData.name && wizardData.category && wizardData.language;
      case 1: // Content
        return wizardData.body.length > 0;
      case 2: // Enrichment
        return true; // Optional step
      case 3: // Interaction
        return true; // Optional step
      case 4: // Personalization
        const placeholders = wizardData.body.match(/\{\{\d+\}\}/g) || [];
        return placeholders.every((p) => {
          const index = p.match(/\d+/)?.[0];
          return index && wizardData.variables[index];
        });
      case 5: // Finalize
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep || completedSteps.includes(index - 1)) {
      setCurrentStep(index);
    }
  };

  const handleSubmit = () => {
    // Transform wizard data to API format
    const apiData = {
      name: wizardData.name,
      displayName: wizardData.displayName,
      category: wizardData.category,
      language: wizardData.language,
      description: wizardData.description,
      components: {
        header: wizardData.header.type !== 'none' ? wizardData.header : undefined,
        body: {
          text: wizardData.body,
          placeholders: Object.entries(wizardData.variables).map(([index, example]) => ({
            index: parseInt(index),
            example,
          })),
        },
        footer: wizardData.footer ? { text: wizardData.footer } : undefined,
        buttons: wizardData.buttons.length > 0 ? wizardData.buttons : undefined,
      },
      sampleValues: wizardData.variables,
    };

    createMutation.mutate(apiData);
  };

  const renderStep = () => {
    const stepProps = {
      data: wizardData,
      updateData,
      onNext: handleNext,
    };

    switch (currentStep) {
      case 0:
        return <IdentityStep {...stepProps} />;
      case 1:
        return <ContentStep {...stepProps} />;
      case 2:
        return <EnrichmentStep {...stepProps} />;
      case 3:
        return <InteractionStep {...stepProps} />;
      case 4:
        return <PersonalizationStep {...stepProps} />;
      case 5:
        return <FinalizeStep {...stepProps} onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="relative px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/80 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {template ? 'Edit Template' : 'Create New Template'}
                </h2>
                <p className="text-sm text-gray-600">Build your WhatsApp message template</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={index > currentStep && !completedSteps.includes(index - 1)}
                    className={`flex flex-col items-center space-y-2 transition-all ${
                      index <= currentStep || completedSteps.includes(index)
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="relative">
                      <motion.div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-semibold transition-all ${
                          index === currentStep
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                            : completedSteps.includes(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                        whileHover={{ scale: index <= currentStep ? 1.05 : 1 }}
                      >
                        {completedSteps.includes(index) ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <span>{step.icon}</span>
                        )}
                      </motion.div>
                      {index === currentStep && (
                        <motion.div
                          layoutId="activeStep"
                          className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-20"
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-xs font-medium ${
                        index === currentStep ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side - Form */}
            <div className="flex-1 overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Side - Preview */}
            <div className="w-[420px] border-l bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-y-auto">
              <WhatsAppPreview data={wizardData} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {STEPS.length}
            </div>
            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    canProceed()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{createMutation.isPending ? 'Submitting...' : 'Submit Template'}</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
