import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import Spinner from './Spinner';

/**
 * Skeleton Loader Component
 */
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:1000px_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-neutral-200',
        variants[variant],
        animations[animation],
        className
      )}
      style={{ width, height }}
    />
  );
};

/**
 * Full Page Loader
 */
export interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
    >
      <Spinner size="xl" variant="primary" />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-neutral-600"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

/**
 * Inline Loader
 */
export interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  message,
  size = 'md',
}) => {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Spinner size={size} variant="primary" />
      {message && <span className="text-neutral-600">{message}</span>}
    </div>
  );
};

/**
 * Overlay Loader
 */
export interface OverlayLoaderProps {
  message?: string;
  transparent?: boolean;
}

export const OverlayLoader: React.FC<OverlayLoaderProps> = ({
  message,
  transparent = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center',
        transparent ? 'bg-white/70' : 'bg-white'
      )}
    >
      <Spinner size="lg" variant="primary" />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-neutral-600"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

/**
 * Skeleton Card for list items
 */
export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-lg border border-neutral-200">
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton width="60%" height={16} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="80%" height={12} />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Table Row
 */
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({
  columns = 4,
}) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height={16} />
        </td>
      ))}
    </tr>
  );
};

/**
 * Progress Bar
 */
export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    danger: 'bg-danger-600',
    warning: 'bg-warning-600',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-neutral-200 rounded-full overflow-hidden', sizes[size])}>
        <motion.div
          className={cn('h-full rounded-full', variants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-neutral-600 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

/**
 * Dots Loader
 */
export const DotsLoader: React.FC<{ variant?: 'primary' | 'secondary' | 'neutral' }> = ({
  variant = 'primary',
}) => {
  const variants = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    neutral: 'bg-neutral-600',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('w-2 h-2 rounded-full', variants[variant])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};
