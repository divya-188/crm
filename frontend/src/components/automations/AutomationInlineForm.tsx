import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Loader2, Zap, X, Filter, Play } from 'lucide-react';
import {
  automationsService,
  Automation,
  CreateAutomationDto,
  AutomationCondition,
  AutomationAction,
} from '../../services/automations.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import toast from 'react-hot-toast';
import TriggerSelector from './TriggerSelector';
import ConditionBuilder from './ConditionBuilder';
import ActionConfigurator from './ActionConfigurator';

interface AutomationInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  automation?: Automation | null;
  mode?: 'create' | 'edit';
}

const AutomationInlineForm: React.FC<AutomationInlineFormProps> = ({
  onSuccess,
  onCancel,
  automation = null,
  mode = 'create',
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!automation;

  const [currentSection, setCurrentSection] = useState<'basic' | 'trigger' | 'conditions' | 'actions'>('basic');
  const [formData, setFormData] = useState<CreateAutomationDto>({
    name: '',
    description: '',
    triggerType: 'message_received',
    triggerConfig: {},
    conditions: [],
    actions: [],
    status: 'draft',
  });

  // Populate form data when editing
  useEffect(() => {
    if (automation && isEditMode) {
      setFormData({
        name: automation.name || '',
        description: automation.description || '',
        triggerType: automation.triggerType,
        triggerConfig: automation.triggerConfig || {},
        conditions: automation.conditions || [],
        actions: automation.actions,
        status: automation.status,
      });
    }
  }, [automation, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAutomationDto) =>
      automation
        ? automationsService.updateAutomation(automation.id, data)
        : automationsService.createAutomation(data),
    onSuccess: () => {
      toast.success(
        automation
          ? 'Automation updated successfully'
          : 'Automation created successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save automation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Automation name is required');
      return;
    }

    if (!formData.triggerType) {
      toast.error('Trigger type is required');
      return;
    }

    if (formData.actions.length === 0) {
      toast.error('At least one action is required');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending;

  const canProceed = () => {
    switch (currentSection) {
      case 'basic':
        return formData.name.trim().length > 0;
      case 'trigger':
        return formData.triggerType.length > 0;
      case 'conditions':
        return true; // Conditions are optional
      case 'actions':
        return formData.actions.length > 0;
      default:
        return false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit Automation' : 'Create New Automation'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode
                ? 'Update automation workflow and settings'
                : 'Set up automated workflows to respond to events'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Section Navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'basic', label: 'Basic Info', icon: Zap },
          { id: 'trigger', label: 'Trigger', icon: Zap },
          { id: 'conditions', label: 'Conditions', icon: Filter },
          { id: 'actions', label: 'Actions', icon: Play },
        ].map((section) => {
          const SectionIcon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setCurrentSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                currentSection === section.id
                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <SectionIcon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        {currentSection === 'basic' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Automation Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('name', e.target.value)
                  }
                  placeholder="e.g., Welcome New Contacts"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange('description', e.target.value)
                  }
                  placeholder="Describe what this automation does..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleChange('status', e.target.value)
                  }
                  options={[
                    { value: 'draft', label: 'Draft - Not active' },
                    { value: 'active', label: 'Active - Running' },
                    { value: 'inactive', label: 'Inactive - Paused' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Trigger Section */}
        {currentSection === 'trigger' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Trigger Configuration
            </h3>
            <TriggerSelector
              triggerType={formData.triggerType}
              triggerConfig={formData.triggerConfig || {}}
              onChange={(triggerType, triggerConfig) =>
                setFormData({ ...formData, triggerType, triggerConfig })
              }
            />
          </div>
        )}

        {/* Conditions Section */}
        {currentSection === 'conditions' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-600" />
              Conditions (Optional)
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Add conditions to control when this automation runs
            </p>
            <ConditionBuilder
              conditions={formData.conditions || []}
              onChange={(conditions) =>
                setFormData({ ...formData, conditions })
              }
            />
          </div>
        )}

        {/* Actions Section */}
        {currentSection === 'actions' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-600" />
              Actions *
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Define what happens when this automation is triggered
            </p>
            <ActionConfigurator
              actions={formData.actions}
              onChange={(actions) => setFormData({ ...formData, actions })}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex gap-2">
            {currentSection !== 'basic' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const sections: Array<'basic' | 'trigger' | 'conditions' | 'actions'> = [
                    'basic',
                    'trigger',
                    'conditions',
                    'actions',
                  ];
                  const currentIndex = sections.indexOf(currentSection);
                  if (currentIndex > 0) {
                    setCurrentSection(sections[currentIndex - 1]);
                  }
                }}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>

            {currentSection === 'actions' ? (
              <Button
                type="submit"
                disabled={isLoading || !canProceed()}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Update Automation' : 'Create Automation'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  const sections: Array<'basic' | 'trigger' | 'conditions' | 'actions'> = [
                    'basic',
                    'trigger',
                    'conditions',
                    'actions',
                  ];
                  const currentIndex = sections.indexOf(currentSection);
                  if (currentIndex < sections.length - 1) {
                    setCurrentSection(sections[currentIndex + 1]);
                  }
                }}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default AutomationInlineForm;
