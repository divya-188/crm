import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  delay?: number;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  delay = 0,
  className,
}) => {
  const colorClasses = {
    primary: {
      gradient: 'from-primary-500 to-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      text: 'text-primary-600 dark:text-primary-400',
    },
    success: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
    },
    warning: {
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    danger: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
    },
    neutral: {
      gradient: 'from-neutral-500 to-neutral-600',
      bg: 'bg-neutral-50 dark:bg-neutral-900/20',
      text: 'text-neutral-600 dark:text-neutral-400',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut',
      }}
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700',
        'p-6 shadow-sm hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br shadow-sm',
            colors.gradient
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
