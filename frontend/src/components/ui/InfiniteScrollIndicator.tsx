import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type IndicatorState = 'loading' | 'complete' | 'error';

export interface InfiniteScrollIndicatorProps {
  state: IndicatorState;
  totalItems?: number;
  loadedItems?: number;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

const InfiniteScrollIndicator: React.FC<InfiniteScrollIndicatorProps> = ({
  state,
  totalItems,
  loadedItems,
  errorMessage = 'Failed to load more items',
  onRetry,
  className,
}) => {
  if (state === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center justify-center py-8',
          className
        )}
      >
        <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading more items...</span>
        </div>
      </motion.div>
    );
  }

  if (state === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center justify-center py-8',
          className
        )}
      >
        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            {totalItems && loadedItems
              ? `Showing all ${loadedItems} of ${totalItems} items`
              : 'All items loaded'}
          </span>
        </div>
      </motion.div>
    );
  }

  if (state === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex flex-col items-center justify-center py-8 gap-3',
          className
        )}
      >
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'bg-primary-600 text-white hover:bg-primary-700',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'dark:focus:ring-offset-neutral-900'
            )}
          >
            Try Again
          </button>
        )}
      </motion.div>
    );
  }

  return null;
};

export default InfiniteScrollIndicator;
