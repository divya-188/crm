import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { fadeInUp } from '../../lib/motion-variants';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  icon,
  className,
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: 'text-blue-600',
      IconComponent: Info,
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-900',
      icon: 'text-success-600',
      IconComponent: CheckCircle,
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-900',
      icon: 'text-warning-600',
      IconComponent: AlertCircle,
    },
    danger: {
      container: 'bg-danger-50 border-danger-200 text-danger-900',
      icon: 'text-danger-600',
      IconComponent: XCircle,
    },
  };

  const { container, icon: iconColor, IconComponent } = variants[variant];
  const IconToRender = icon || <IconComponent size={20} />;

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        container,
        className
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        {IconToRender}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};

export default Alert;
