import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Template Error Logger Service
 * Requirement 20.6: Create error logging
 * 
 * Provides centralized error logging for template operations with:
 * - Structured error logging
 * - Context preservation
 * - Error categorization
 * - Performance tracking
 */

export interface ErrorLogContext {
  tenantId?: string;
  userId?: string;
  templateId?: string;
  templateName?: string;
  operation: string;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface ErrorLogEntry extends ErrorLogContext {
  id: string;
  severity: 'error' | 'warn' | 'info';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

@Injectable()
export class TemplateErrorLoggerService {
  private readonly logger = new Logger(TemplateErrorLoggerService.name);

  constructor() {}

  /**
   * Log an error with full context
   * Requirement 20.6: Create error logging
   */
  async logError(context: ErrorLogContext): Promise<void> {
    const logEntry = {
      ...context,
      timestamp: context.timestamp || new Date(),
      severity: 'error' as const,
    };

    // Log to console with structured format
    this.logger.error(
      `[${context.operation}] ${context.errorMessage}`,
      {
        errorCode: context.errorCode,
        tenantId: context.tenantId,
        userId: context.userId,
        templateId: context.templateId,
        templateName: context.templateName,
        metadata: context.metadata,
      },
    );

    // In production, this would also:
    // 1. Store in database for audit trail
    // 2. Send to external logging service (e.g., Sentry, DataDog)
    // 3. Trigger alerts for critical errors
    // 4. Update error metrics

    // TODO: Implement database storage
    // await this.errorLogRepository.save(logEntry);

    // TODO: Send to external logging service
    // await this.externalLogger.log(logEntry);

    // TODO: Check if error requires immediate alert
    // if (this.isCriticalError(context.errorCode)) {
    //   await this.alertService.sendAlert(logEntry);
    // }
  }

  /**
   * Log a warning
   */
  async logWarning(context: ErrorLogContext): Promise<void> {
    const logEntry = {
      ...context,
      timestamp: context.timestamp || new Date(),
      severity: 'warn' as const,
    };

    this.logger.warn(
      `[${context.operation}] ${context.errorMessage}`,
      {
        errorCode: context.errorCode,
        tenantId: context.tenantId,
        userId: context.userId,
        templateId: context.templateId,
        metadata: context.metadata,
      },
    );
  }

  /**
   * Log an info message
   */
  async logInfo(context: ErrorLogContext): Promise<void> {
    const logEntry = {
      ...context,
      timestamp: context.timestamp || new Date(),
      severity: 'info' as const,
    };

    this.logger.log(
      `[${context.operation}] ${context.errorMessage}`,
      {
        errorCode: context.errorCode,
        tenantId: context.tenantId,
        userId: context.userId,
        templateId: context.templateId,
        metadata: context.metadata,
      },
    );
  }

  /**
   * Log validation errors with field-level details
   * Requirement 20.1: Field-level error indicators
   */
  async logValidationError(
    context: Omit<ErrorLogContext, 'errorMessage'>,
    validationErrors: Array<{
      field: string;
      message: string;
      code: string;
      value?: any;
    }>,
  ): Promise<void> {
    const errorMessage = `Validation failed with ${validationErrors.length} error(s)`;
    
    await this.logError({
      ...context,
      errorMessage,
      errorCode: 'TEMPLATE_VALIDATION_ERROR',
      metadata: {
        ...context.metadata,
        validationErrors,
        errorCount: validationErrors.length,
        fields: validationErrors.map(e => e.field),
      },
    });
  }

  /**
   * Log Meta API errors with retry information
   * Requirement 20.6: Retry mechanisms for API failures
   */
  async logMetaApiError(
    context: Omit<ErrorLogContext, 'errorMessage'>,
    metaError: {
      code?: number;
      subcode?: number;
      message?: string;
      type?: string;
    },
    isRetryable: boolean,
    retryAttempt?: number,
    maxRetries?: number,
  ): Promise<void> {
    const errorMessage = `Meta API error: ${metaError.message || 'Unknown error'}`;
    
    await this.logError({
      ...context,
      errorMessage,
      errorCode: 'META_API_ERROR',
      metadata: {
        ...context.metadata,
        metaError,
        isRetryable,
        retryAttempt,
        maxRetries,
        willRetry: isRetryable && (retryAttempt || 0) < (maxRetries || 0),
      },
    });
  }

  /**
   * Log operation performance
   * Useful for identifying slow operations
   */
  async logPerformance(
    operation: string,
    durationMs: number,
    context?: {
      tenantId?: string;
      userId?: string;
      templateId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    const severity = durationMs > 5000 ? 'warn' : 'info';
    const message = `Operation '${operation}' took ${durationMs}ms`;

    if (severity === 'warn') {
      this.logger.warn(message, {
        operation,
        durationMs,
        ...context,
      });
    } else {
      this.logger.log(message, {
        operation,
        durationMs,
        ...context,
      });
    }
  }

  /**
   * Create a performance tracker for an operation
   * Usage:
   *   const tracker = errorLogger.startPerformanceTracking('createTemplate');
   *   // ... do work ...
   *   await tracker.end({ templateId: '123' });
   */
  startPerformanceTracking(operation: string): {
    end: (context?: {
      tenantId?: string;
      userId?: string;
      templateId?: string;
      metadata?: Record<string, any>;
    }) => Promise<void>;
  } {
    const startTime = Date.now();

    return {
      end: async (context) => {
        const durationMs = Date.now() - startTime;
        await this.logPerformance(operation, durationMs, context);
      },
    };
  }

  /**
   * Log batch operation results
   * Useful for import/export and bulk operations
   */
  async logBatchOperation(
    operation: string,
    results: {
      total: number;
      successful: number;
      failed: number;
      errors?: Array<{ item: string; error: string }>;
    },
    context?: {
      tenantId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    const severity = results.failed > 0 ? 'warn' : 'info';
    const message = `Batch ${operation}: ${results.successful}/${results.total} successful, ${results.failed} failed`;

    const logContext: ErrorLogContext = {
      ...context,
      operation,
      errorMessage: message,
      errorCode: results.failed > 0 ? 'BATCH_OPERATION_PARTIAL_FAILURE' : undefined,
      metadata: {
        ...context?.metadata,
        results,
      },
    };

    if (severity === 'warn') {
      await this.logWarning(logContext);
    } else {
      await this.logInfo(logContext);
    }
  }

  /**
   * Determine if an error is critical and requires immediate attention
   */
  private isCriticalError(errorCode?: string): boolean {
    const criticalErrors = [
      'DATABASE_ERROR',
      'META_API_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'INTERNAL_SERVER_ERROR',
    ];

    return errorCode ? criticalErrors.includes(errorCode) : false;
  }

  /**
   * Format error for user display
   * Requirement 20.2: User-friendly error messages
   */
  formatUserFriendlyError(error: Error | any): {
    message: string;
    code?: string;
    field?: string;
    suggestions?: string[];
  } {
    // If it's already a template exception with user-friendly message
    if (error.errorCode && error.message) {
      return {
        message: error.message,
        code: error.errorCode,
        field: error.field,
        suggestions: this.getErrorSuggestions(error.errorCode),
      };
    }

    // Handle common error types
    if (error.name === 'ValidationError') {
      return {
        message: 'Please check your input and try again',
        code: 'VALIDATION_ERROR',
        suggestions: ['Review the highlighted fields', 'Ensure all required fields are filled'],
      };
    }

    if (error.name === 'QueryFailedError') {
      return {
        message: 'A database error occurred. Please try again',
        code: 'DATABASE_ERROR',
        suggestions: ['Try again in a few moments', 'Contact support if the issue persists'],
      };
    }

    // Generic error
    return {
      message: 'An unexpected error occurred. Please try again',
      code: 'UNKNOWN_ERROR',
      suggestions: ['Refresh the page and try again', 'Contact support if the issue persists'],
    };
  }

  /**
   * Get helpful suggestions based on error code
   * Requirement 20.2: User-friendly error messages
   */
  private getErrorSuggestions(errorCode: string): string[] {
    const suggestions: Record<string, string[]> = {
      TEMPLATE_VALIDATION_ERROR: [
        'Review the validation errors below',
        'Check placeholder formatting (use {{1}}, {{2}}, etc.)',
        'Ensure button text is under 25 characters',
        'Verify all required fields are filled',
      ],
      TEMPLATE_DUPLICATE_NAME: [
        'Choose a different template name',
        'Template names must be unique within your account',
        'Consider adding a version number or date to the name',
      ],
      TEMPLATE_NOT_FOUND: [
        'Verify the template ID is correct',
        'The template may have been deleted',
        'Check if you have access to this template',
      ],
      INVALID_TEMPLATE_STATUS: [
        'Check the current template status',
        'Some operations are only allowed for specific statuses',
        'Wait for template approval before using it',
      ],
      META_API_ERROR: [
        'Check your Meta API credentials',
        'Verify your WhatsApp Business Account is active',
        'Try again in a few moments',
        'Contact Meta support if the issue persists',
      ],
      TEMPLATE_IN_USE: [
        'Pause or complete active campaigns using this template',
        'Consider archiving instead of deleting',
        'Create a new version if you need to make changes',
      ],
      TEMPLATE_MEDIA_ERROR: [
        'Check the file size and format',
        'Supported formats: JPEG, PNG for images; MP4 for videos; PDF for documents',
        'Maximum file sizes: 5MB (images), 16MB (videos), 100MB (documents)',
      ],
      TEMPLATE_PERMISSION_DENIED: [
        'Contact your administrator for access',
        'You may need additional permissions for this operation',
        'Check your role and permissions',
      ],
    };

    return suggestions[errorCode] || [
      'Try again in a few moments',
      'Contact support if the issue persists',
    ];
  }
}
