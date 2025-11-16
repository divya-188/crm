import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Toast Notification Component with Beautiful Design
 */
interface ToastContentProps {
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onDismiss: () => void;
}

const ToastContent: React.FC<ToastContentProps> = ({
  title,
  message,
  type,
  onDismiss,
}) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700',
    },
    error: {
      icon: XCircle,
      bgGradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
    },
    warning: {
      icon: AlertCircle,
      bgGradient: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-700',
    },
    info: {
      icon: Info,
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
    },
  };

  const { icon: Icon, bgGradient, borderColor, iconBg, iconColor, titleColor, messageColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${bgGradient}
        border ${borderColor}
        rounded-xl shadow-lg
        p-4 pr-12
        min-w-[320px] max-w-[420px]
        backdrop-blur-sm
      `}
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />

      <div className="relative flex items-start gap-3">
        {/* Icon with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className={`flex-shrink-0 ${iconBg} rounded-lg p-2`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <motion.h4
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`font-semibold ${titleColor} text-sm mb-1 leading-tight`}
            >
              {title}
            </motion.h4>
          )}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-sm ${messageColor} leading-relaxed`}
          >
            {message}
          </motion.p>
        </div>

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDismiss}
          className={`
            absolute top-3 right-3
            flex-shrink-0 p-1.5 rounded-lg
            ${iconBg} ${iconColor}
            hover:bg-opacity-80
            transition-all duration-200
          `}
        >
          <X size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Toast Helper Functions
 */
export const showToast = {
  success: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          type="success"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        position: 'top-right',
        ...options,
      }
    );
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          type="error"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 6000,
        position: 'top-right',
        ...options,
      }
    );
  },

  warning: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          type="warning"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 5000,
        position: 'top-right',
        ...options,
      }
    );
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          type="info"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        position: 'top-right',
        ...options,
      }
    );
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: (data) => {
          const message =
            typeof messages.success === 'function' ? messages.success(data) : messages.success;
          return message;
        },
        error: (error) => {
          const message =
            typeof messages.error === 'function' ? messages.error(error) : messages.error;
          return message;
        },
      },
      { position: 'top-right', ...options }
    );
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { position: 'top-right', ...options });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Toast Container Component
 * Add this to your root App component
 */
export const ToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        top: 24,
        right: 24,
        zIndex: 99999,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
      }}
    />
  );
};

export default showToast;
