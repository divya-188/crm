import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      checked,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              className="sr-only peer"
              {...props}
            />
            <motion.div
              className={cn(
                'w-5 h-5 rounded border-2 transition-all cursor-pointer',
                'flex items-center justify-center',
                error
                  ? 'border-danger-500'
                  : 'border-neutral-300 peer-checked:border-primary-600 peer-checked:bg-primary-600',
                'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2',
                'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                className
              )}
              whileTap={{ scale: 0.95 }}
            >
              {checked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Check size={14} className="text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.div>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="flex-1 text-sm font-medium text-neutral-700 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-sm text-danger-600 ml-8"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500 ml-8">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
