import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface SwitchProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "size"
  > {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}


const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  function SwitchComponent(
    { className, label, description, size = "md", id, checked, onChange, disabled, ...props },
    ref
  ): JSX.Element {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const sizes = {
      sm: {
        track: "w-8 h-4",
        thumb: "w-3 h-3",
        translateX: 16,
      },
      md: {
        track: "w-11 h-6",
        thumb: "w-5 h-5",
        translateX: 20,
      },
      lg: {
        track: "w-14 h-7",
        thumb: "w-6 h-6",
        translateX: 28,
      },
    };

    const { track, thumb, translateX } = sizes[size];

    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={(e) => {
              console.log('🔥 Switch onChange fired:', { 
                id: switchId, 
                checked: e.target.checked,
                hasOnChange: !!onChange 
              });
              if (onChange) {
                onChange(e);
              }
            }}
            disabled={disabled}
            className="sr-only"
            {...props}
          />

          <label 
            htmlFor={switchId} 
            className={cn(
              "cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <motion.div
              className={cn(
                track,
                "rounded-full transition-colors relative",
                checked ? "bg-primary-600" : "bg-neutral-300",
                disabled && "opacity-50"
              )}
              whileTap={!disabled ? { scale: 0.95 } : {}}
            >
              <motion.div
                className={cn(
                  thumb,
                  "bg-white rounded-full shadow-md absolute top-0.5 left-0.5"
                )}
                animate={{
                  x: checked ? translateX : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            </motion.div>
          </label>
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  "block text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                "mt-0.5 text-sm text-neutral-500 dark:text-neutral-400",
                disabled && "opacity-50"
              )}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
export default Switch;
