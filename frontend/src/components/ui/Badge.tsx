import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-primary-100 text-primary-700 border-primary-200',
      secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
      success: 'bg-success-100 text-success-700 border-success-200',
      danger: 'bg-danger-100 text-danger-700 border-danger-200',
      warning: 'bg-warning-100 text-warning-700 border-warning-200',
      info: 'bg-blue-100 text-blue-700 border-blue-200',
      neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const dotColors = {
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      success: 'bg-success-500',
      danger: 'bg-danger-500',
      warning: 'bg-warning-500',
      info: 'bg-blue-500',
      neutral: 'bg-neutral-500',
    };

    return (
      <motion.span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full border',
          variants[variant],
          sizes[size],
          className
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        {...(props as any)}
      >
        {dot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
        )}
        {children}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
