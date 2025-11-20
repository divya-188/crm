import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, HelpCircle, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-danger-100 dark:bg-danger-900/20',
      iconColor: 'text-danger-600 dark:text-danger-400',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-warning-100 dark:bg-warning-900/20',
      iconColor: 'text-warning-600 dark:text-warning-400',
      buttonVariant: 'warning' as const,
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonVariant: 'primary' as const,
    },
    primary: {
      icon: HelpCircle,
      iconBg: 'bg-primary-100 dark:bg-primary-900/20',
      iconColor: 'text-primary-600 dark:text-primary-400',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Confirm action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const loading = isLoading || isProcessing;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
      showCloseButton={!loading}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
              config.iconBg
            )}
          >
            {typeof IconComponent === 'function' ? (
              <IconComponent className={cn('w-6 h-6', config.iconColor)} />
            ) : (
              IconComponent
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg font-semibold text-neutral-900 dark:text-white mb-2"
            >
              {title}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
            >
              {message}
            </motion.p>
          </div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-end gap-3 mt-6"
        >
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={loading}
            isLoading={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
