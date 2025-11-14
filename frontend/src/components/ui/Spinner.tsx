import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white' | 'neutral';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
}) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const variants = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    neutral: 'text-neutral-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <Loader2
        className={cn('animate-spin', variants[variant])}
        size={sizes[size]}
      />
    </motion.div>
  );
};

export default Spinner;
