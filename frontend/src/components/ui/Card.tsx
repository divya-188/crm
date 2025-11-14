import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white border border-neutral-200 shadow-sm',
      bordered: 'bg-white border-2 border-neutral-300',
      elevated: 'bg-white shadow-lg border border-neutral-100',
      flat: 'bg-neutral-50',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg transition-all',
          variants[variant],
          paddings[padding],
          hoverable && 'cursor-pointer',
          className
        )}
        whileHover={hoverable ? { scale: 1.02, y: -2 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
