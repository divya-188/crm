import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { SubscriptionPlan } from '../../services/subscription-plans.service';

interface PlanDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  plan: SubscriptionPlan | null;
  isLoading?: boolean;
}

const PlanDeleteModal: React.FC<PlanDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  plan,
  isLoading = false,
}) => {
  if (!plan) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Delete Subscription Plan
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Are you sure you want to delete the <strong>{plan.name}</strong> plan? This action cannot be undone.
            </p>

            <Alert variant="warning" className="mb-4">
              <p className="text-sm">
                <strong>Warning:</strong> You cannot delete a plan that has active subscriptions. 
                If there are active subscriptions, please deactivate the plan instead.
              </p>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete Plan'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PlanDeleteModal;
