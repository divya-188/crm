import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Custom Toast Configuration
 */
const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#fff',
    color: '#0f172a',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    maxWidth: '500px',
  },
};

/**
 * Toast Notification Component
 */
interface ToastContentProps {
  title?: string;
  message: string;
  icon: React.ReactNode;
  iconColor: string;
  onDismiss: () => void;
}

const ToastContent: React.FC<ToastContentProps> = ({
  title,
  message,
  icon,
  iconColor,
  onDismiss,
}) => {
  return (
    <div className="flex items-start gap-3 w-full">
      <div className={`flex-shrink-0 ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-neutral-900 mb-0.5">{title}</h4>
        )}
        <p className="text-sm text-neutral-600">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600"
      >
        <X size={16} />
      </button>
    </div>
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
          icon={<CheckCircle size={20} />}
          iconColor="text-success-600"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { ...defaultOptions, ...options }
    );
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          icon={<XCircle size={20} />}
          iconColor="text-danger-600"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { ...defaultOptions, duration: 6000, ...options }
    );
  },

  warning: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          icon={<AlertCircle size={20} />}
          iconColor="text-warning-600"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { ...defaultOptions, ...options }
    );
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <ToastContent
          title={title}
          message={message}
          icon={<Info size={20} />}
          iconColor="text-blue-600"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { ...defaultOptions, ...options }
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
          const message = typeof messages.success === 'function' 
            ? messages.success(data) 
            : messages.success;
          return message;
        },
        error: (error) => {
          const message = typeof messages.error === 'function' 
            ? messages.error(error) 
            : messages.error;
          return message;
        },
      },
      { ...defaultOptions, ...options }
    );
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
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
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#0f172a',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '500px',
        },
      }}
    />
  );
};

export default showToast;
