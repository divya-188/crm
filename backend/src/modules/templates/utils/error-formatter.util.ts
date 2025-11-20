/**
 * Error Formatter Utility
 * Requirement 20.1: Field-level error indicators
 * Requirement 20.2: User-friendly error messages
 * 
 * Provides utilities for formatting errors into user-friendly responses
 * with field-level indicators and actionable suggestions.
 */

export interface FormattedError {
  message: string;
  code: string;
  field?: string;
  statusCode: number;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
    value?: any;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  suggestions?: string[];
  timestamp: string;
  requestId?: string;
}

export class ErrorFormatter {
  /**
   * Format a validation error with field-level details
   * Requirement 20.1: Field-level error indicators
   */
  static formatValidationError(
    errors: Array<{
      field: string;
      message: string;
      code: string;
      value?: any;
    }>,
    warnings?: Array<{
      field: string;
      message: string;
      code: string;
    }>,
  ): FormattedError {
    return {
      message: `Validation failed with ${errors.length} error(s)`,
      code: 'TEMPLATE_VALIDATION_ERROR',
      statusCode: 400,
      errors,
      warnings,
      suggestions: [
        'Review the errors below and correct the highlighted fields',
        'Ensure all required fields are filled',
        'Check that placeholders follow the {{1}}, {{2}} format',
        'Verify button text is under 25 characters',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a Meta API error with retry information
   * Requirement 20.6: Retry mechanisms for API failures
   */
  static formatMetaApiError(
    message: string,
    metaError?: {
      code?: number;
      subcode?: number;
      message?: string;
      type?: string;
    },
    isRetryable: boolean = false,
    retryAfter?: number,
  ): FormattedError {
    const suggestions: string[] = [];

    if (isRetryable) {
      suggestions.push(
        `This error is temporary. Please try again${retryAfter ? ` in ${Math.ceil(retryAfter / 1000)} seconds` : ''}.`,
      );
    } else {
      suggestions.push('This error requires manual intervention.');
    }

    // Add specific suggestions based on Meta error code
    if (metaError?.code) {
      suggestions.push(...this.getMetaErrorSuggestions(metaError.code));
    }

    return {
      message,
      code: 'META_API_ERROR',
      statusCode: isRetryable ? 503 : 502,
      errors: metaError
        ? [
            {
              field: 'meta_api',
              message: metaError.message || message,
              code: `META_${metaError.code}`,
            },
          ]
        : undefined,
      suggestions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a template not found error
   */
  static formatNotFoundError(
    templateId: string,
    tenantId?: string,
  ): FormattedError {
    return {
      message: `Template with ID '${templateId}' not found`,
      code: 'TEMPLATE_NOT_FOUND',
      field: 'templateId',
      statusCode: 404,
      suggestions: [
        'Verify the template ID is correct',
        'The template may have been deleted or archived',
        'Check if you have access to this template',
        'Try refreshing the template list',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a template status error
   */
  static formatStatusError(
    message: string,
    currentStatus: string,
    requiredStatus?: string | string[],
  ): FormattedError {
    const suggestions: string[] = [
      `Current template status: ${currentStatus}`,
    ];

    if (requiredStatus) {
      const required = Array.isArray(requiredStatus)
        ? requiredStatus.join(', ')
        : requiredStatus;
      suggestions.push(`Required status: ${required}`);
    }

    suggestions.push(
      'Wait for template approval before using it in messages',
      'Check the template status in the templates list',
    );

    return {
      message,
      code: 'INVALID_TEMPLATE_STATUS',
      field: 'status',
      statusCode: 400,
      errors: [
        {
          field: 'status',
          message,
          code: 'INVALID_STATUS',
          value: currentStatus,
        },
      ],
      suggestions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a template in use error
   * Requirement 19.7: Prevent deletion of templates in active campaigns
   */
  static formatInUseError(
    templateId: string,
    activeCampaigns: Array<{ id: string; name: string }>,
  ): FormattedError {
    const campaignNames = activeCampaigns.map(c => c.name).join(', ');

    return {
      message: `Cannot delete template: it is used in ${activeCampaigns.length} active campaign(s)`,
      code: 'TEMPLATE_IN_USE',
      statusCode: 409,
      errors: [
        {
          field: 'campaigns',
          message: `Template is used in: ${campaignNames}`,
          code: 'ACTIVE_CAMPAIGNS',
          value: activeCampaigns.map(c => c.id),
        },
      ],
      suggestions: [
        'Pause or complete the active campaigns first',
        'Consider archiving the template instead of deleting',
        'Create a new version if you need to make changes',
        'Wait for campaigns to complete before deleting',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a duplicate name error
   */
  static formatDuplicateNameError(
    templateName: string,
  ): FormattedError {
    return {
      message: `Template with name '${templateName}' already exists`,
      code: 'TEMPLATE_DUPLICATE_NAME',
      field: 'name',
      statusCode: 409,
      errors: [
        {
          field: 'name',
          message: 'Template name must be unique',
          code: 'DUPLICATE_NAME',
          value: templateName,
        },
      ],
      suggestions: [
        'Choose a different template name',
        'Add a version number or date to make it unique',
        'Check existing templates to avoid duplicates',
        'Use lowercase letters, numbers, and underscores only',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a media upload error
   */
  static formatMediaError(
    message: string,
    mediaType?: string,
    fileSize?: number,
    maxSize?: number,
  ): FormattedError {
    const suggestions: string[] = [
      'Check the file format and size',
    ];

    if (mediaType) {
      suggestions.push(this.getMediaTypeSuggestion(mediaType));
    }

    if (fileSize && maxSize) {
      suggestions.push(
        `Your file is ${this.formatFileSize(fileSize)}, maximum allowed is ${this.formatFileSize(maxSize)}`,
      );
    }

    return {
      message,
      code: 'TEMPLATE_MEDIA_ERROR',
      field: 'media',
      statusCode: 400,
      errors: [
        {
          field: 'media',
          message,
          code: 'INVALID_MEDIA',
          value: { mediaType, fileSize, maxSize },
        },
      ],
      suggestions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a permission error
   */
  static formatPermissionError(
    operation: string,
    requiredPermission?: string,
  ): FormattedError {
    return {
      message: `Insufficient permissions to ${operation} template`,
      code: 'TEMPLATE_PERMISSION_DENIED',
      statusCode: 403,
      suggestions: [
        'Contact your administrator for access',
        requiredPermission
          ? `Required permission: ${requiredPermission}`
          : 'You may need additional permissions',
        'Check your role and permissions in account settings',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format a batch operation error
   */
  static formatBatchError(
    operation: string,
    results: {
      total: number;
      successful: number;
      failed: number;
      errors: Array<{ item: string; error: string }>;
    },
  ): FormattedError {
    return {
      message: `Batch ${operation}: ${results.successful}/${results.total} successful, ${results.failed} failed`,
      code: 'BATCH_OPERATION_PARTIAL_FAILURE',
      statusCode: 207, // Multi-Status
      errors: results.errors.map(e => ({
        field: 'batch_item',
        message: e.error,
        code: 'BATCH_ITEM_FAILED',
        value: e.item,
      })),
      suggestions: [
        'Review the failed items below',
        'Retry failed items individually',
        'Check error messages for each failed item',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get suggestions based on Meta error code
   */
  private static getMetaErrorSuggestions(errorCode: number): string[] {
    const suggestions: Record<number, string[]> = {
      1: ['Meta API is experiencing issues', 'Try again in a few minutes'],
      2: ['Meta service is temporarily unavailable', 'Try again later'],
      4: ['Rate limit exceeded', 'Wait before making more requests'],
      17: ['Too many requests from your account', 'Reduce request frequency'],
      32: ['Your account is temporarily blocked', 'Contact Meta support'],
      100: ['Invalid parameter in request', 'Check your template data'],
      190: ['Access token expired', 'Refresh your Meta API credentials'],
      368: ['Temporarily blocked for policy violations', 'Review Meta policies'],
      613: ['Rate limit exceeded', 'Wait before retrying'],
    };

    return suggestions[errorCode] || [
      'Check Meta API documentation for error code ' + errorCode,
      'Contact Meta support if the issue persists',
    ];
  }

  /**
   * Get media type specific suggestion
   */
  private static getMediaTypeSuggestion(mediaType: string): string {
    const suggestions: Record<string, string> = {
      IMAGE: 'Supported formats: JPEG, PNG. Maximum size: 5MB',
      VIDEO: 'Supported formats: MP4, 3GPP. Maximum size: 16MB',
      DOCUMENT: 'Supported formats: PDF. Maximum size: 100MB',
    };

    return suggestions[mediaType] || 'Check supported media formats';
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Format a generic error
   */
  static formatGenericError(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
  ): FormattedError {
    return {
      message,
      code,
      statusCode,
      suggestions: [
        'Try again in a few moments',
        'Refresh the page',
        'Contact support if the issue persists',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add request ID to formatted error
   */
  static withRequestId(
    error: FormattedError,
    requestId: string,
  ): FormattedError {
    return {
      ...error,
      requestId,
    };
  }

  /**
   * Sanitize error for production
   * Removes sensitive information like stack traces
   */
  static sanitizeForProduction(error: FormattedError): FormattedError {
    const sanitized = { ...error };

    // Remove any stack traces or internal details
    if (sanitized.errors) {
      sanitized.errors = sanitized.errors.map(e => ({
        field: e.field,
        message: e.message,
        code: e.code,
        // Remove value in production for security
      }));
    }

    return sanitized;
  }
}
