import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiresAt: Date;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, className }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, total: diff });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpiringSoon = timeRemaining.total > 0 && timeRemaining.total < 3 * 60 * 60 * 1000; // < 3 hours
  const isCritical = timeRemaining.total > 0 && timeRemaining.total < 1 * 60 * 60 * 1000; // < 1 hour

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Animated Clock Icon */}
      <motion.div
        animate={{
          rotate: [0, -10, 10, -10, 10, 0],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 2,
        }}
        className={cn(
          'relative',
          isCritical && 'text-red-600',
          isExpiringSoon && !isCritical && 'text-orange-600',
          !isExpiringSoon && 'text-blue-600'
        )}
      >
        <Clock size={20} />
        
        {/* Pulse effect for critical time */}
        {isCritical && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>

      {/* Time Display */}
      <div className="flex items-center gap-1 font-mono text-sm font-semibold">
        <AnimatePresence mode="popLayout">
          {/* Hours */}
          <motion.span
            key={`hours-${timeRemaining.hours}`}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'inline-block min-w-[1.5ch] text-right',
              isCritical && 'text-red-700',
              isExpiringSoon && !isCritical && 'text-orange-700',
              !isExpiringSoon && 'text-blue-700'
            )}
          >
            {String(timeRemaining.hours).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>

        <span className="text-neutral-500">:</span>

        <AnimatePresence mode="popLayout">
          {/* Minutes */}
          <motion.span
            key={`minutes-${timeRemaining.minutes}`}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'inline-block min-w-[2ch] text-right',
              isCritical && 'text-red-700',
              isExpiringSoon && !isCritical && 'text-orange-700',
              !isExpiringSoon && 'text-blue-700'
            )}
          >
            {String(timeRemaining.minutes).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>

        <span className="text-neutral-500">:</span>

        <AnimatePresence mode="popLayout">
          {/* Seconds */}
          <motion.span
            key={`seconds-${timeRemaining.seconds}`}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'inline-block min-w-[2ch] text-right',
              isCritical && 'text-red-700',
              isExpiringSoon && !isCritical && 'text-orange-700',
              !isExpiringSoon && 'text-blue-700'
            )}
          >
            {String(timeRemaining.seconds).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-xs font-medium',
          isCritical && 'text-red-700',
          isExpiringSoon && !isCritical && 'text-orange-700',
          !isExpiringSoon && 'text-blue-700'
        )}
      >
        remaining
      </span>
    </div>
  );
};
