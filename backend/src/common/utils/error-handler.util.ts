import { Logger } from '@nestjs/common';
import {
  ExternalServiceException,
  DatabaseException,
  ValidationException,
  ResourceNotFoundException,
} from '../exceptions/custom-exceptions';

export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  /**
   * Handle external API errors (e.g., WhatsApp, Payment gateways)
   */
  static handleExternalApiError(
    serviceName: string,
    error: any,
    context?: string,
  ): never {
    this.logger.error(
      `External API Error - ${serviceName}${context ? ` (${context})` : ''}`,
      error.stack || error,
    );

    const message = error.response?.data?.error?.message || error.message || 'External service error';
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    throw new ExternalServiceException(serviceName, message, {
      statusCode,
      errorCode,
      originalError: error.response?.data || error.message,
    });
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: any, operation?: string): never {
    this.logger.error(
      `Database Error${operation ? ` during ${operation}` : ''}`,
      error.stack || error,
    );

    const message = operation
      ? `Database operation failed: ${operation}`
      : 'Database operation failed';

    throw new DatabaseException(message, {
      code: error.code,
      detail: error.detail,
    });
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(errors: any[], context?: string): never {
    this.logger.warn(
      `Validation Error${context ? ` in ${context}` : ''}`,
      JSON.stringify(errors),
    );

    throw new ValidationException('Validation failed', { errors });
  }

  /**
   * Handle resource not found
   */
  static handleNotFound(resource: string, identifier?: string): never {
    this.logger.warn(`Resource not found: ${resource}${identifier ? ` (${identifier})` : ''}`);
    throw new ResourceNotFoundException(resource, identifier);
  }

  /**
   * Wrap async operations with error handling
   */
  static async wrapAsync<T>(
    operation: () => Promise<T>,
    errorContext: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`Error in ${errorContext}`, error.stack || error);
      throw error;
    }
  }

  /**
   * Safe error message extraction
   */
  static extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error?.message) return error.response.data.error.message;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const statusCode = error.response?.status || error.statusCode;
    return retryableStatusCodes.includes(statusCode);
  }
}
