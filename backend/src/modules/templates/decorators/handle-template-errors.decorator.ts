import { Logger } from '@nestjs/common';
import {
  TemplateException,
  TemplateValidationException,
  TemplateNotFoundException,
  TemplateStatusException,
  TemplateSubmissionException,
  MetaApiException,
  TemplateDuplicateNameException,
  TemplateInUseException,
  TemplateMediaException,
  TemplatePermissionException,
  TemplateImportException,
  TemplateExportException,
  TemplateTestException,
  TemplateAnalyticsException,
  TemplateVersionException,
  TemplateArchiveException,
} from '../exceptions';

/**
 * Decorator for handling template errors in controllers
 * Requirement 20.1: Field-level error indicators
 * Requirement 20.2: User-friendly error messages
 * 
 * Automatically catches and transforms errors into user-friendly responses
 * with proper HTTP status codes and structured error information.
 * 
 * Usage:
 * @HandleTemplateErrors()
 * async createTemplate(@Body() dto: CreateTemplateDto) {
 *   return await this.templatesService.create(dto);
 * }
 */
export function HandleTemplateErrors() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyKey}`);

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Log the error
        logger.error(
          `Error in ${propertyKey}: ${error.message}`,
          error.stack,
        );

        // If it's already a template exception, just rethrow
        if (error instanceof TemplateException) {
          throw error;
        }

        // Transform common errors into template exceptions
        throw transformError(error, propertyKey);
      }
    };

    return descriptor;
  };
}

/**
 * Transform generic errors into template-specific exceptions
 * Requirement 20.2: User-friendly error messages
 */
function transformError(error: any, operation: string): TemplateException {
  // Handle validation errors
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return new TemplateValidationException(
      'Template validation failed',
      error.errors || [
        {
          field: 'unknown',
          message: error.message,
          code: 'VALIDATION_ERROR',
        },
      ],
    );
  }

  // Handle not found errors
  if (error.name === 'NotFoundException' || error.status === 404) {
    return new TemplateNotFoundException(
      error.templateId || 'unknown',
      error.tenantId,
    );
  }

  // Handle duplicate key errors (database)
  if (error.code === '23505' || error.message?.includes('duplicate')) {
    return new TemplateDuplicateNameException(
      error.detail || 'unknown',
      error.tenantId || 'unknown',
    );
  }

  // Handle permission errors
  if (error.name === 'ForbiddenException' || error.status === 403) {
    return new TemplatePermissionException(
      operation,
      error.userId,
      error.requiredPermission,
    );
  }

  // Handle Meta API errors
  if (error.message?.includes('Meta') || error.message?.includes('WhatsApp')) {
    const isRetryable = MetaApiException.isRetryableError(error.code);
    return new MetaApiException(
      error.message,
      error.code,
      error.subcode,
      isRetryable,
      error.retryAfter,
    );
  }

  // Handle timeout errors
  if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
    return new MetaApiException(
      'Request timed out. Please try again.',
      undefined,
      undefined,
      true, // Retryable
      5000, // Retry after 5 seconds
    );
  }

  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new MetaApiException(
      'Unable to connect to external service. Please try again later.',
      undefined,
      undefined,
      true, // Retryable
      10000, // Retry after 10 seconds
    );
  }

  // Default: wrap in generic template exception
  return new TemplateException(
    error.message || 'An unexpected error occurred',
    error.status || 500,
    error.code || 'INTERNAL_ERROR',
    error.field,
    {
      originalError: error.name,
      operation,
    },
  );
}

/**
 * Decorator for operations that require retry logic
 * Requirement 20.6: Add retry mechanisms for API failures
 * 
 * Usage:
 * @WithRetry({ maxAttempts: 3 })
 * async submitToMeta(templateId: string) {
 *   return await this.metaApiClient.submit(templateId);
 * }
 */
export function WithRetry(options: {
  maxAttempts?: number;
  initialDelayMs?: number;
  retryableErrors?: string[];
} = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyKey}`);

    descriptor.value = async function (...args: any[]) {
      const maxAttempts = options.maxAttempts || 3;
      const initialDelay = options.initialDelayMs || 1000;
      const retryableErrors = options.retryableErrors || [
        'META_API_ERROR',
        'TIMEOUT_ERROR',
        'NETWORK_ERROR',
      ];

      let lastError: any;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          // Check if error is retryable
          const isRetryable =
            error instanceof MetaApiException && error.isRetryable ||
            retryableErrors.includes(error.errorCode) ||
            retryableErrors.includes(error.name);

          // If not retryable or last attempt, throw
          if (!isRetryable || attempt >= maxAttempts) {
            logger.error(
              `Operation failed after ${attempt} attempt(s): ${error.message}`,
            );
            throw error;
          }

          // Calculate delay with exponential backoff
          const delay = initialDelay * Math.pow(2, attempt - 1);
          logger.warn(
            `Attempt ${attempt} failed, retrying in ${delay}ms...`,
          );

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Decorator for logging operation performance
 * Useful for identifying slow operations
 * 
 * Usage:
 * @LogPerformance()
 * async createTemplate(@Body() dto: CreateTemplateDto) {
 *   return await this.templatesService.create(dto);
 * }
 */
export function LogPerformance(thresholdMs: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyKey}`);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > thresholdMs) {
          logger.warn(
            `Operation took ${duration}ms (threshold: ${thresholdMs}ms)`,
          );
        } else {
          logger.log(`Operation completed in ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(
          `Operation failed after ${duration}ms: ${error.message}`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for validating request context
 * Ensures required context (tenantId, userId) is present
 * 
 * Usage:
 * @ValidateContext(['tenantId', 'userId'])
 * async createTemplate(@TenantId() tenantId: string, @UserId() userId: string) {
 *   return await this.templatesService.create(tenantId, userId, dto);
 * }
 */
export function ValidateContext(requiredFields: string[] = ['tenantId']) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyKey}`);

    descriptor.value = async function (...args: any[]) {
      // Extract parameter names from function
      const paramNames = getParameterNames(originalMethod);

      // Check if required fields are present
      for (const field of requiredFields) {
        const index = paramNames.indexOf(field);
        if (index === -1 || !args[index]) {
          logger.error(`Missing required context field: ${field}`);
          throw new TemplateException(
            `Missing required context: ${field}`,
            400,
            'MISSING_CONTEXT',
            field,
          );
        }
      }

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Helper function to extract parameter names from function
 */
function getParameterNames(func: Function): string[] {
  const funcStr = func.toString();
  const match = funcStr.match(/\(([^)]*)\)/);
  
  if (!match || !match[1]) {
    return [];
  }

  return match[1]
    .split(',')
    .map(param => param.trim().split(/\s+/)[0])
    .filter(param => param && param !== '...');
}
