import toast, { ToastOptions } from 'react-hot-toast';

/**
 * Centralized Toast System
 * Uses theme colors from tailwind.config.js
 * 
 * Available toast types:
 * - success: Blue (#3b82f6) - For successful operations
 * - error: Rose (#f43f5e) - For errors and failures
 * - warning: Yellow (#eab308) - For warnings and cautions
 * - info: Cyan (#06b6d4) - For informational messages
 * - loading: Slate (#64748b) - For loading states
 * - confirm: Purple (#8b5cf6) - For confirmations (custom)
 */

// Theme colors from tailwind.config.js
const THEME_COLORS = {
  success: '#3b82f6',    // success-500 (Blue)
  error: '#f43f5e',      // danger-500 (Rose)
  warning: '#eab308',    // warning-500 (Yellow)
  info: '#06b6d4',       // secondary-500 (Cyan)
  loading: '#64748b',    // neutral-500 (Slate)
  confirm: '#8b5cf6',    // primary-500 (Purple)
  white: '#ffffff',
} as const;

// Base toast styling
const baseStyle = {
  fontWeight: '600',
  borderRadius: '8px',
  padding: '16px 20px',
  fontSize: '15px',
  minWidth: '280px',
  maxWidth: '500px',
  zIndex: 999999,
};

// Toast configurations for each type
const toastConfigs = {
  success: {
    style: {
      ...baseStyle,
      background: THEME_COLORS.success,
      color: THEME_COLORS.white,
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
    },
    iconTheme: {
      primary: THEME_COLORS.white,
      secondary: THEME_COLORS.success,
    },
  },
  error: {
    style: {
      ...baseStyle,
      background: THEME_COLORS.error,
      color: THEME_COLORS.white,
      boxShadow: '0 8px 24px rgba(244, 63, 94, 0.25)',
    },
    iconTheme: {
      primary: THEME_COLORS.white,
      secondary: THEME_COLORS.error,
    },
  },
  warning: {
    style: {
      ...baseStyle,
      background: THEME_COLORS.warning,
      color: THEME_COLORS.white,
      boxShadow: '0 8px 24px rgba(234, 179, 8, 0.25)',
    },
    iconTheme: {
      primary: THEME_COLORS.white,
      secondary: THEME_COLORS.warning,
    },
  },
  info: {
    style: {
      ...baseStyle,
      background: THEME_COLORS.info,
      color: THEME_COLORS.white,
      boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25)',
    },
    iconTheme: {
      primary: THEME_COLORS.white,
      secondary: THEME_COLORS.info,
    },
  },
  loading: {
    style: {
      ...baseStyle,
      background: THEME_COLORS.loading,
      color: THEME_COLORS.white,
      boxShadow: '0 8px 24px rgba(100, 116, 139, 0.25)',
    },
    iconTheme: {
      primary: THEME_COLORS.white,
      secondary: THEME_COLORS.loading,
    },
  },
  confirm: {
    style: {
      ...baseStyle,
      background: THEME_COLORS.confirm,
      color: THEME_COLORS.white,
      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)',
    },
    iconTheme: {
      primary: THEME_COLORS.white,
      secondary: THEME_COLORS.confirm,
    },
  },
};

/**
 * Centralized Toast System
 */
export const Toast = {
  /**
   * Success toast - Blue color
   * Use for: Successful operations, confirmations, completions
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...toastConfigs.success,
      duration: options?.duration || 3000,
      ...options,
    });
  },

  /**
   * Error toast - Rose/Red color
   * Use for: Errors, failures, critical issues
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...toastConfigs.error,
      duration: options?.duration || 4000,
      ...options,
    });
  },

  /**
   * Warning toast - Yellow color
   * Use for: Warnings, cautions, important notices
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...toastConfigs.warning,
      icon: '⚠️',
      duration: options?.duration || 3500,
      ...options,
    });
  },

  /**
   * Info toast - Cyan color
   * Use for: Informational messages, tips, updates
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...toastConfigs.info,
      icon: 'ℹ️',
      duration: options?.duration || 3000,
      ...options,
    });
  },

  /**
   * Loading toast - Slate/Gray color
   * Use for: Loading states, processing operations
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...toastConfigs.loading,
      ...options,
    });
  },

  /**
   * Confirm toast - Purple color
   * Use for: Confirmations, acknowledgments
   */
  confirm: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...toastConfigs.confirm,
      icon: '✓',
      duration: options?.duration || 2500,
      ...options,
    });
  },

  /**
   * Promise toast - Handles async operations
   * Automatically shows loading, success, or error based on promise result
   */
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
      messages,
      {
        loading: toastConfigs.loading,
        success: toastConfigs.success,
        error: toastConfigs.error,
        ...options,
      }
    );
  },

  /**
   * Custom toast with custom styling
   */
  custom: (message: string, customOptions: ToastOptions) => {
    return toast(message, {
      ...baseStyle,
      ...customOptions,
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  /**
   * Remove a specific toast or all toasts
   */
  remove: (toastId?: string) => {
    return toast.remove(toastId);
  },
};

/**
 * Common toast messages for typical scenarios
 */
export const ToastMessages = {
  // Success messages
  saved: 'Changes saved successfully',
  created: 'Created successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  uploaded: 'Uploaded successfully',
  downloaded: 'Downloaded successfully',
  copied: 'Copied to clipboard',
  sent: 'Sent successfully',
  submitted: 'Submitted successfully',
  synced: 'Synced successfully',
  
  // Error messages
  saveFailed: 'Failed to save changes',
  createFailed: 'Failed to create',
  updateFailed: 'Failed to update',
  deleteFailed: 'Failed to delete',
  uploadFailed: 'Failed to upload',
  downloadFailed: 'Failed to download',
  sendFailed: 'Failed to send',
  submitFailed: 'Failed to submit',
  syncFailed: 'Failed to sync',
  networkError: 'Network error. Please try again',
  serverError: 'Server error. Please try again later',
  
  // Warning messages
  unsavedChanges: 'You have unsaved changes',
  invalidInput: 'Please check your input',
  limitReached: 'Limit reached',
  
  // Info messages
  processing: 'Processing...',
  loading: 'Loading...',
  pleaseWait: 'Please wait...',
};

/**
 * Helper functions for common toast patterns
 */
export const ToastHelpers = {
  /**
   * Show success toast with custom message
   */
  showSuccess: (action: string, item?: string) => {
    const message = item ? `${item} ${action} successfully` : `${action} successfully`;
    return Toast.success(message);
  },

  /**
   * Show error toast with custom message
   */
  showError: (action: string, item?: string) => {
    const message = item ? `Failed to ${action} ${item}` : `Failed to ${action}`;
    return Toast.error(message);
  },

  /**
   * Show loading toast and return toast ID for later dismissal
   */
  showLoading: (action: string) => {
    return Toast.loading(`${action}...`);
  },

  /**
   * Update loading toast to success
   */
  updateToSuccess: (toastId: string, message: string) => {
    toast.dismiss(toastId);
    return Toast.success(message);
  },

  /**
   * Update loading toast to error
   */
  updateToError: (toastId: string, message: string) => {
    toast.dismiss(toastId);
    return Toast.error(message);
  },

  /**
   * Show confirmation prompt (requires user action)
   * Note: This is a visual toast, not a blocking dialog
   */
  showConfirmation: (message: string, duration = 5000) => {
    return Toast.confirm(message, { duration });
  },
};

// Export default for convenience
export default Toast;
