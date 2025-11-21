import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWindowStatus } from '@/hooks/useWindowStatus';
import { useAuth } from '@/hooks/useAuth';
import { CountdownTimer } from './CountdownTimer';

interface WindowStatusBannerProps {
  conversationId: string;
}

export const WindowStatusBanner: React.FC<WindowStatusBannerProps> = ({ conversationId }) => {
  const { data: windowStatus, isLoading } = useWindowStatus(conversationId);
  const { hasRole } = useAuth();

  if (isLoading || !windowStatus) {
    return null;
  }

  const { isOpen, hoursRemaining, expiresAt } = windowStatus;
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  // Don't show banner if window is open and has plenty of time
  if (isOpen && hoursRemaining && hoursRemaining > 12) {
    return null;
  }

  // Window is closed
  if (!isOpen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            'px-4 py-3 border-b',
            isAdmin ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-start gap-3">
            {isAdmin ? (
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <ShieldAlert className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                isAdmin ? 'text-amber-900' : 'text-red-900'
              )}>
                {isAdmin 
                  ? '24-Hour Messaging Window Closed'
                  : '⛔ Messaging Window Expired - Contact Admin'
                }
              </p>
              <p className={cn(
                'text-xs mt-1',
                isAdmin ? 'text-amber-700' : 'text-red-700'
              )}>
                {isAdmin 
                  ? 'You can only send approved template messages. Free-form messages are not allowed until the customer replies.'
                  : 'You cannot send messages because the 24-hour window has expired. Only admins can send template messages. Please contact your administrator or wait for the customer to reply.'
                }
              </p>
              {!isAdmin && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  💡 Reason: WhatsApp requires customer interaction within 24 hours to allow free-form messaging.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Window is open but expiring soon (< 12 hours)
  const isExpiringSoon = hoursRemaining && hoursRemaining < 3;
  const isCritical = hoursRemaining && hoursRemaining < 1;
  
  const bgColor = isCritical ? 'bg-red-50' : isExpiringSoon ? 'bg-orange-50' : 'bg-blue-50';
  const borderColor = isCritical ? 'border-red-200' : isExpiringSoon ? 'border-orange-200' : 'border-blue-200';
  const textColor = isCritical ? 'text-red-900' : isExpiringSoon ? 'text-orange-900' : 'text-blue-900';
  const subTextColor = isCritical ? 'text-red-700' : isExpiringSoon ? 'text-orange-700' : 'text-blue-700';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          'px-4 py-3 border-b',
          bgColor,
          borderColor
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle className={cn(subTextColor, 'flex-shrink-0 mt-0.5')} size={20} />
            <div className="flex-1">
              <p className={cn('text-sm font-medium', textColor)}>
                {isCritical 
                  ? '🔥 Messaging Window Expiring Very Soon!'
                  : isExpiringSoon 
                  ? '⚠️ Messaging Window Expiring Soon' 
                  : '✅ Messaging Window Open'
                }
              </p>
              <p className={cn('text-xs mt-1', subTextColor)}>
                {isCritical
                  ? 'Less than 1 hour remaining! Respond quickly or use templates after expiry.'
                  : 'You can send free-form messages. After expiry, only template messages are allowed.'
                }
              </p>
            </div>
          </div>

          {/* Animated Countdown Timer */}
          {expiresAt && (
            <div className="flex-shrink-0">
              <CountdownTimer expiresAt={expiresAt} />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
