import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={cn(
        'flex',
        isHorizontal ? 'flex-row items-center' : 'flex-col',
        className
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isActive = index === currentStep;
        const isCompleted = step.status === 'completed' || index < currentStep;
        const isError = step.status === 'error';

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div
              className={cn(
                'flex items-center gap-3',
                !isHorizontal && 'w-full'
              )}
            >
              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex-shrink-0"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && !isError && 'bg-success-500',
                    isActive && !isError && 'bg-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30',
                    !isCompleted && !isActive && !isError && 'bg-neutral-200 dark:bg-neutral-700',
                    isError && 'bg-danger-500'
                  )}
                >
                  {isCompleted && !isError ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isError ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Pulse animation for active step */}
                {isActive && !isError && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary-500"
                  />
                )}
              </motion.div>

              {/* Step Content */}
              <motion.div
                initial={{ opacity: 0, x: isHorizontal ? -10 : 0, y: isHorizontal ? 0 : -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: index * 0.1 + 0.1 }}
                className={cn(
                  'flex-1 min-w-0',
                  !isHorizontal && 'pb-6'
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive && 'text-primary-600 dark:text-primary-400',
                    isCompleted && !isError && 'text-success-600 dark:text-success-400',
                    !isActive && !isCompleted && !isError && 'text-neutral-500 dark:text-neutral-400',
                    isError && 'text-danger-600 dark:text-danger-400'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {step.description}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <motion.div
                initial={{ scaleX: isHorizontal ? 0 : 1, scaleY: isHorizontal ? 1 : 0 }}
                animate={{ scaleX: 1, scaleY: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                className={cn(
                  'transition-colors duration-300',
                  isHorizontal
                    ? 'h-0.5 flex-1 mx-2'
                    : 'w-0.5 h-8 ml-5 -mt-6',
                  isCompleted && !isError
                    ? 'bg-success-500'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                )}
                style={{
                  transformOrigin: isHorizontal ? 'left' : 'top',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;
