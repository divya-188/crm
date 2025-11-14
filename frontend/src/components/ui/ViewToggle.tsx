import React from 'react';
import { Grid3x3, List } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ViewMode = 'grid' | 'list';

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  value,
  onChange,
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, mode: ViewMode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(mode);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1',
        className
      )}
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        onKeyDown={(e) => handleKeyDown(e, 'grid')}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          value === 'grid'
            ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        )}
        aria-label="Grid view"
        aria-pressed={value === 'grid'}
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        onKeyDown={(e) => handleKeyDown(e, 'list')}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          value === 'list'
            ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        )}
        aria-label="List view"
        aria-pressed={value === 'list'}
      >
        <List className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ViewToggle;
