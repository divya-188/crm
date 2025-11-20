import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Filter,
  Play,
  Save,
} from 'lucide-react';
import {
  automationsService,
  Automation,
  CreateAutomationDto,
  AutomationCondition,
  AutomationAction,
} from '@/services/automations.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Toast from '@/lib/toast-system';
import TriggerSelector from './TriggerSelector';
import ConditionBuilder from './ConditionBuilder';
import ActionConfigurator from './ActionConfigurator';

interface AutomationWizardProps {
  automation?: Automation | null;
  onClose: () => void;
}

const steps = [
  { id: 1, name: 'Basic Info', icon: Zap },
  { id: 2, name: 'Trigger', icon: Zap },
  { id: 3, name: 'Conditions', icon: Filter },
  { id: 4, name: 'Actions', icon: Play },
];

const AutomationWizard: React.FC<AutomationWizardProps> = ({
  automation,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateAutomationDto>({
    name: '',
    description: '',
    triggerType: 'message_received',
    triggerConfig: {},
    conditions: [],
    actions: [],
    status: 'draft',
  });

  useEffect(() => {
    if (automation) {
      setFormData({
        name: automation.name,
        description: automation.description || '',
        triggerType: automation.triggerType,
        triggerConfig: automation.triggerConfig || {},
        conditions: automation.conditions || [],
        actions: automation.actions,
        status: automation.status,
      });
    }
  }, [automation]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAutomationDto) =>
      automation
        ? automationsService.updateAutomation(automation.id, data)
        : automationsService.createAutomation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      Toast.success(
        automation
          ? 'Automation updated successfully'
          : 'Automation created successfully'
      );
      onClose();
    },
    onError: () => {
      Toast.error('Failed to save automation');
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = (status: 'draft' | 'active') => {
    const dataToSave = { ...formData, status };
    createMutation.mutate(dataToSave);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.triggerType.length > 0;
      case 3:
        return true; // Conditions are optional
      case 4:
        return formData.actions.length > 0;
      default:
        return false;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={automation ? 'Edit Automation' : 'Create Automation'}
      size="xl"
    >
      <div className="flex flex-col h-[600px]">
        {/* Steps Progress */}
        <div className="flex items-center justify-between mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 ${
                  currentStep === step.id
                    ? 'text-primary-600 dark:text-primary-400'
                    : currentStep > step.id
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step.id
                      ? 'bg-primary-100 dark:bg-primary-900'
                      : currentStep > step.id
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Automation Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Welcome New Contacts"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe what this automation does..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <TriggerSelector
                  triggerType={formData.triggerType}
                  triggerConfig={formData.triggerConfig || {}}
                  onChange={(triggerType, triggerConfig) =>
                    setFormData({ ...formData, triggerType, triggerConfig })
                  }
                />
              )}

              {currentStep === 3 && (
                <ConditionBuilder
                  conditions={formData.conditions || []}
                  onChange={(conditions) =>
                    setFormData({ ...formData, conditions })
                  }
                />
              )}

              {currentStep === 4 && (
                <ActionConfigurator
                  actions={formData.actions}
                  onChange={(actions) => setFormData({ ...formData, actions })}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === steps.length ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleSave('draft')}
                  disabled={!canProceed() || createMutation.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSave('active')}
                  disabled={!canProceed() || createMutation.isPending}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save & Activate
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AutomationWizard;
