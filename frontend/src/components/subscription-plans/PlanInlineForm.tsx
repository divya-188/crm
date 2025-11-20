import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, Save, Loader2, DollarSign, Calendar, Zap, X } from 'lucide-react';
import { subscriptionPlansService, CreatePlanData, SubscriptionPlan } from '../../services/subscription-plans.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Toast from '@/lib/toast-system';

interface PlanInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  plan?: SubscriptionPlan | null;
  mode?: 'create' | 'edit';
}

const PlanInlineForm: React.FC<PlanInlineFormProps> = ({ 
  onSuccess, 
  onCancel, 
  plan = null,
  mode = 'create'
}) => {
  const isEditMode = mode === 'edit' || !!plan;

  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    features: {
      maxContacts: 1000,
      maxUsers: 5,
      maxConversations: 500,
      maxCampaigns: 10,
      maxFlows: 5,
      maxAutomations: 10,
      whatsappConnections: 1,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
    },
    isActive: true,
    sortOrder: 0,
  });

  // Populate form data when editing
  useEffect(() => {
    if (plan && isEditMode) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || 0,
        billingCycle: plan.billingCycle || 'monthly',
        features: plan.features || {
          maxContacts: 1000,
          maxUsers: 5,
          maxConversations: 500,
          maxCampaigns: 10,
          maxFlows: 5,
          maxAutomations: 10,
          whatsappConnections: 1,
          apiAccess: false,
          customBranding: false,
          prioritySupport: false,
        },
        isActive: plan.isActive ?? true,
        sortOrder: plan.sortOrder || 0,
      });
    }
  }, [plan, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePlanData) => subscriptionPlansService.create(data),
    onSuccess: () => {
      Toast.success('Plan created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to create plan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreatePlanData) => subscriptionPlansService.update(plan!.id, data),
    onSuccess: () => {
      Toast.success('Plan updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to update plan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Toast.error('Plan name is required');
      return;
    }
    if (formData.price < 0) {
      Toast.error('Price must be a positive number');
      return;
    }
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (key: keyof typeof formData.features, value: any) => {
    console.log('🔧 handleFeatureChange called:', { key, value, currentValue: formData.features[key] });
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        features: {
          ...prev.features,
          [key]: value,
        },
      };
      console.log('✅ New formData:', newFormData);
      return newFormData;
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit Subscription Plan' : 'Create New Plan'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Update plan details and features' : 'Configure a new subscription plan'}
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Plan Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                placeholder="e.g., Professional"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Price *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Billing Cycle *
              </label>
              <Select
                value={formData.billingCycle}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('billingCycle', e.target.value)}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'annual', label: 'Annual' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Sort Order
              </label>
              <Input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                placeholder="Describe the plan features and benefits..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Feature Limits */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Feature Limits
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max Contacts
              </label>
              <Input
                type="number"
                min="0"
                value={formData.features.maxContacts}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('maxContacts', parseInt(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max Users
              </label>
              <Input
                type="number"
                min="1"
                value={formData.features.maxUsers}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('maxUsers', parseInt(e.target.value) || 1)}
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max Conversations
              </label>
              <Input
                type="number"
                min="0"
                value={formData.features.maxConversations}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('maxConversations', parseInt(e.target.value) || 0)}
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max Campaigns
              </label>
              <Input
                type="number"
                min="0"
                value={formData.features.maxCampaigns}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('maxCampaigns', parseInt(e.target.value) || 0)}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max Flows
              </label>
              <Input
                type="number"
                min="0"
                value={formData.features.maxFlows}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('maxFlows', parseInt(e.target.value) || 0)}
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max Automations
              </label>
              <Input
                type="number"
                min="0"
                value={formData.features.maxAutomations}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('maxAutomations', parseInt(e.target.value) || 0)}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                WhatsApp Connections
              </label>
              <Input
                type="number"
                min="1"
                value={formData.features.whatsappConnections}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange('whatsappConnections', parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* Premium Features */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            Premium Features
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">API Access</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Allow access to REST API endpoints
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.features.apiAccess}
                onChange={(e) => handleFeatureChange('apiAccess', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Custom Branding</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Enable custom logo and colors
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.features.customBranding}
                onChange={(e) => handleFeatureChange('customBranding', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Priority Support</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  24/7 priority customer support
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.features.prioritySupport}
                onChange={(e) => handleFeatureChange('prioritySupport', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Plan Status */}
        <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">Active Plan</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Make this plan available for subscription
            </p>
          </div>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
          />
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Plan' : 'Create Plan'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default PlanInlineForm;
