import toast from './toast';

/**
 * Template-specific feedback messages and toast helpers
 * Provides consistent user feedback across all template operations
 */

export const templateFeedback = {
  // Create operations
  create: {
    loading: 'Creating template...',
    success: (name: string) => `Template "${name}" created successfully`,
    error: 'Failed to create template. Please try again.',
  },

  // Update operations
  update: {
    loading: 'Updating template...',
    success: (name: string) => `Template "${name}" updated successfully`,
    error: 'Failed to update template. Please try again.',
  },

  // Delete operations
  delete: {
    loading: 'Deleting template...',
    success: (name: string) => `Template "${name}" deleted successfully`,
    error: 'Failed to delete template. Please try again.',
  },

  // Submit operations
  submit: {
    loading: 'Submitting template for approval...',
    success: (name: string) => `Template "${name}" submitted for approval`,
    error: 'Failed to submit template. Please check validation errors.',
  },

  // Duplicate operations
  duplicate: {
    loading: 'Duplicating template...',
    success: (name: string) => `Template duplicated as "${name}"`,
    error: 'Failed to duplicate template. Please try again.',
  },

  // Import operations
  import: {
    loading: 'Importing templates...',
    success: (count: number) => `Successfully imported ${count} template${count !== 1 ? 's' : ''}`,
    error: (failedCount: number) => `Failed to import ${failedCount} template${failedCount !== 1 ? 's' : ''}`,
    partial: (success: number, failed: number) => 
      `Imported ${success} template${success !== 1 ? 's' : ''}, ${failed} failed`,
  },

  // Export operations
  export: {
    loading: 'Exporting templates...',
    success: (count: number) => `Successfully exported ${count} template${count !== 1 ? 's' : ''}`,
    error: 'Failed to export templates. Please try again.',
  },

  // Test operations
  test: {
    loading: 'Sending test message...',
    success: 'Test message sent successfully',
    error: 'Failed to send test message. Please try again.',
  },

  // Validation operations
  validation: {
    success: 'Template validation passed',
    error: (errorCount: number) => `Template has ${errorCount} validation error${errorCount !== 1 ? 's' : ''}`,
    warning: (warningCount: number) => `Template has ${warningCount} warning${warningCount !== 1 ? 's' : ''}`,
  },

  // Status updates
  status: {
    approved: (name: string) => `Template "${name}" has been approved`,
    rejected: (name: string, reason?: string) => 
      reason 
        ? `Template "${name}" was rejected: ${reason}`
        : `Template "${name}" was rejected`,
    pending: (name: string) => `Template "${name}" is pending approval`,
  },

  // Media operations
  media: {
    uploading: 'Uploading media...',
    success: 'Media uploaded successfully',
    error: 'Failed to upload media. Please check file size and format.',
  },

  // Analytics operations
  analytics: {
    loading: 'Loading analytics...',
    error: 'Failed to load analytics. Please try again.',
  },
};

/**
 * Show success toast for template operations
 */
export function showTemplateSuccess(
  operation: keyof typeof templateFeedback,
  ...args: any[]
) {
  const feedback = templateFeedback[operation];
  if (feedback && 'success' in feedback) {
    const message = typeof feedback.success === 'function'
      ? feedback.success(...args)
      : feedback.success;
    toast.success(message);
  }
}

/**
 * Show error toast for template operations
 */
export function showTemplateError(
  operation: keyof typeof templateFeedback,
  ...args: any[]
) {
  const feedback = templateFeedback[operation];
  if (feedback && 'error' in feedback) {
    const message = typeof feedback.error === 'function'
      ? feedback.error(...args)
      : feedback.error;
    toast.error(message);
  }
}

/**
 * Show loading toast for template operations
 */
export function showTemplateLoading(
  operation: keyof typeof templateFeedback
): string {
  const feedback = templateFeedback[operation];
  if (feedback && 'loading' in feedback) {
    return toast.loading(feedback.loading);
  }
  return toast.loading('Processing...');
}

/**
 * Handle template operation with automatic feedback
 */
export async function withTemplateFeedback<T>(
  operation: keyof typeof templateFeedback,
  asyncFn: () => Promise<T>,
  successArgs?: any[]
): Promise<T> {
  const loadingToast = showTemplateLoading(operation);
  
  try {
    const result = await asyncFn();
    toast.dismiss(loadingToast);
    showTemplateSuccess(operation, ...(successArgs || []));
    return result;
  } catch (error) {
    toast.dismiss(loadingToast);
    showTemplateError(operation);
    throw error;
  }
}
