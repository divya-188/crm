/**
 * UI Components Index
 * Export all reusable UI components from a single entry point
 */

// Form Components
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { default as Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { default as Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { default as Switch } from './Switch';
export type { SwitchProps } from './Switch';

// Layout Components
export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

// Feedback Components
export { default as Alert } from './Alert';
export type { AlertProps } from './Alert';

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { default as Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

// Loading States
export {
  Skeleton,
  PageLoader,
  InlineLoader,
  OverlayLoader,
  SkeletonCard,
  SkeletonTableRow,
  ProgressBar,
  DotsLoader,
} from './LoadingStates';

export type {
  SkeletonProps,
  PageLoaderProps,
  InlineLoaderProps,
  OverlayLoaderProps,
  ProgressBarProps,
} from './LoadingStates';

// Modern UI Components
export { default as StatsCard } from './StatsCard';
export type { StatsCardProps } from './StatsCard';

export { default as ViewToggle } from './ViewToggle';
export type { ViewToggleProps, ViewMode } from './ViewToggle';

export { default as InfiniteScrollIndicator } from './InfiniteScrollIndicator';
export type { InfiniteScrollIndicatorProps, IndicatorState } from './InfiniteScrollIndicator';

export { default as EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
