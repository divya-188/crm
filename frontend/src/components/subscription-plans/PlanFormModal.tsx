import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Switch from '../ui/Switch';
import { SubscriptionPlan, CreatePlanData } from '../../services/subscription-plans.service';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlanData) => Promise<void>;
  plan?: SubscriptionPlan | null;
  isLoading?: boolean;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  plan,
  isLoading = false,
}) => {
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      });
    } else {
      // Reset form when creating new plan
      setFormData({
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
    }
    setErrors({});
  }, [plan, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (formData.features.maxContacts < 0) {
      newErrors.maxContacts = 'Max contacts must be a positive number';
    }

    if (formData.features.maxUsers < 1) {
      newErrors.maxUsers = 'At least 1 user is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleFeatureChange = (key: keyof typeof formData.features, value: any) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value,
      },
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {plan ? 'Edit Plan' : 'Create New Plan'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {plan ? 'Update subscription plan details' : 'Configure a new subscription plan'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Plan Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professional"
                  error={errors.name}
                  required
                />
              </div>

              <div>
                <Input
                  label="Price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  error={errors.price}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Billing Cycle"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annual', label: 'Annual' },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the plan features and benefits..."
                rows={3}
              />
            </div>
          </div>

          {/* Feature Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Feature Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Max Contacts"
                  type="number"
                  value={formData.features.maxContacts}
                  onChange={(e) => handleFeatureChange('maxContacts', parseInt(e.target.value) || 0)}
                  placeholder="1000"
                  error={errors.maxContacts}
                />
              </div>

              <div>
                <Input
                  label="Max Users"
                  type="number"
                  value={formData.features.maxUsers}
                  onChange={(e) => handleFeatureChange('maxUsers', parseInt(e.target.value) || 1)}
                  placeholder="5"
                  error={errors.maxUsers}
                />
              </div>

              <div>
                <Input
                  label="Max Conversations"
                  type="number"
                  value={formData.features.maxConversations}
                  onChange={(e) => handleFeatureChange('maxConversations', parseInt(e.target.value) || 0)}
                  placeholder="500"
                />
              </div>

              <div>
                <Input
                  label="Max Campaigns"
                  type="number"
                  value={formData.features.maxCampaigns}
                  onChange={(e) => handleFeatureChange('maxCampaigns', parseInt(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>

              <div>
                <Input
                  label="Max Flows"
                  type="number"
                  value={formData.features.maxFlows}
                  onChange={(e) => handleFeatureChange('maxFlows', parseInt(e.target.value) || 0)}
                  placeholder="5"
                />
              </div>

              <div>
                <Input
                  label="Max Automations"
                  type="number"
                  value={formData.features.maxAutomations}
                  onChange={(e) => handleFeatureChange('maxAutomations', parseInt(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>

              <div>
                <Input
                  label="WhatsApp Connections"
                  type="number"
                  value={formData.features.whatsappConnections}
                  onChange={(e) => handleFeatureChange('whatsappConnections', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Premium Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Premium Features
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">API Access</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Allow access to REST API endpoints
                  </p>
                </div>
                <Switch
                  checked={formData.features.apiAccess}
                  onChange={(checked) => handleFeatureChange('apiAccess', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Custom Branding</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Enable custom logo and colors
                  </p>
                </div>
                <Switch
                  checked={formData.features.customBranding}
                  onChange={(checked) => handleFeatureChange('customBranding', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Priority Support</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    24/7 priority customer support
                  </p>
                </div>
                <Switch
                  checked={formData.features.prioritySupport}
                  onChange={(checked) => handleFeatureChange('prioritySupport', checked)}
                />
              </div>
            </div>
          </div>

          {/* Plan Status */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Active Plan</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Make this plan available for subscription
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PlanFormModal;
