import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, X as XIcon, Zap, Users, MessageSquare, Send, Workflow, Bot, Smartphone } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { SubscriptionPlan } from '../../services/subscription-plans.service';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
}

const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  plans,
}) => {
  console.log('🔍 PlanComparisonModal - Plans data:', plans);
  console.log('🔍 PlanComparisonModal - Plans count:', plans.length);
  plans.forEach((plan, index) => {
    console.log(`📋 Plan ${index + 1}:`, {
      name: plan.name,
      price: plan.price,
      priceType: typeof plan.price,
      features: plan.features,
    });
  });

  const formatPrice = (price: number | string, cycle: string) => {
    const cycleLabel = cycle === 'monthly' ? '/mo' : cycle === 'quarterly' ? '/qtr' : '/yr';
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return `$${priceNum.toFixed(2)}${cycleLabel}`;
  };

  const featureRows = [
    { key: 'maxContacts', label: 'Max Contacts', icon: Users },
    { key: 'maxUsers', label: 'Max Users', icon: Users },
    { key: 'maxConversations', label: 'Max Conversations', icon: MessageSquare },
    { key: 'maxCampaigns', label: 'Max Campaigns', icon: Send },
    { key: 'maxFlows', label: 'Max Flows', icon: Workflow },
    { key: 'maxAutomations', label: 'Max Automations', icon: Bot },
    { key: 'whatsappConnections', label: 'WhatsApp Connections', icon: Smartphone },
    { key: 'apiAccess', label: 'API Access', icon: Zap, boolean: true },
    { key: 'customBranding', label: 'Custom Branding', icon: Zap, boolean: true },
    { key: 'prioritySupport', label: 'Priority Support', icon: Zap, boolean: true },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Plan Comparison
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Compare features across all subscription plans
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200 dark:border-neutral-700">
                <th className="text-left p-4 font-semibold text-neutral-900 dark:text-white">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="p-4 text-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                          {plan.name}
                        </h3>
                        {!plan.isActive && (
                          <Badge variant="neutral" size="sm">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formatPrice(plan.price, plan.billingCycle)}
                      </div>
                      {plan.description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.tr
                    key={feature.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {feature.label}
                        </span>
                      </div>
                    </td>
                    {plans.map((plan) => {
                      const value = plan.features[feature.key as keyof typeof plan.features];
                      console.log(`🎯 Feature ${feature.key} for ${plan.name}:`, {
                        value,
                        valueType: typeof value,
                        isBoolean: feature.boolean,
                      });
                      return (
                        <td key={plan.id} className="p-4 text-center">
                          {feature.boolean ? (
                            value ? (
                              <div className="flex justify-center">
                                <div className="w-6 h-6 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-success-600 dark:text-success-400" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                  <XIcon className="w-4 h-4 text-neutral-400" />
                                </div>
                              </div>
                            )
                          ) : (
                            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                              {typeof value === 'number' ? value.toLocaleString() : value || '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PlanComparisonModal;
