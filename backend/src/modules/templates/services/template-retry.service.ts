import { Injectable, Logger } from '@nestjs/common';
import { TemplateErrorLoggerService } from './template-error-logger.service';
import { MetaApiException } from '../exceptions';

/**
 * Template Retry Service
 * Requirement 20.6: Add retry mechanisms for API failures
 * 
 * Provides intelligent retry logic for:
 * - Meta API calls
 * - External service calls
 * - Transient failures
 * 
 * Features:
 * - Exponential backoff
 * - Configurable retry attempts
 * - Retry only for retryable errors
 * - Circuit breaker pattern
 * - Detailed logging
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: any) => void | Promise<void>;
}

export interface RetryContext {
  tenantId?: string;
  userId?: string;
  templateId?: string;
  operation: string;
}

@Injectable()
export class TemplateRetryService {
  private readonly logger = new Logger(TemplateRetryService.name);
  private readonly defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'META_API_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVICE_UNAVAILABLE',
    ],
    onRetry: () => {},
  };

  constructor(
    private readonly errorLogger: TemplateErrorLoggerService,
  ) {}

  /**
   * Execute an operation with retry logic
   * Requirement 20.6: Add retry mechanisms for API failures
   * 
   * @param operation - The operation to execute
   * @param context - Context for logging
   * @param options - Retry configuration
   * @returns Result of the operation
   * @throws Last error if all retries fail
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: RetryContext,
    options: RetryOptions = {},
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      attempt++;

      try {
        this.logger.log(
          `[${context.operation}] Attempt ${attempt}/${config.maxAttempts}`,
        );

        const result = await operation();

        // Success - log if this was a retry
        if (attempt > 1) {
          await this.errorLogger.logInfo({
            ...context,
            operation: context.operation,
            errorMessage: `Operation succeeded after ${attempt} attempt(s)`,
            metadata: {
              totalAttempts: attempt,
              maxAttempts: config.maxAttempts,
            },
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, config.retryableErrors);

        // Log the error
        await this.errorLogger.logError({
          ...context,
          operation: context.operation,
          errorMessage: error.message || 'Operation failed',
          errorCode: error.errorCode || error.name,
          stackTrace: error.stack,
          metadata: {
            attempt,
            maxAttempts: config.maxAttempts,
            isRetryable,
            willRetry: isRetryable && attempt < config.maxAttempts,
          },
        });

        // If not retryable or last attempt, throw
        if (!isRetryable || attempt >= config.maxAttempts) {
          this.logger.error(
            `[${context.operation}] Failed after ${attempt} attempt(s): ${error.message}`,
          );
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);

        this.logger.warn(
          `[${context.operation}] Attempt ${attempt} failed, retrying in ${delay}ms...`,
        );

        // Call onRetry callback if provided
        if (config.onRetry) {
          await config.onRetry(attempt, error);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Execute Meta API call with retry logic
   * Specialized retry for Meta API with specific error handling
   */
  async executeMetaApiCall<T>(
    operation: () => Promise<T>,
    context: RetryContext,
    options: RetryOptions = {},
  ): Promise<T> {
    return this.executeWithRetry(
      operation,
      context,
      {
        ...options,
        onRetry: async (attempt, error) => {
          // Log Meta-specific error details
          if (error instanceof MetaApiException) {
            await this.errorLogger.logMetaApiError(
              context,
              {
                code: error.metaErrorCode,
                subcode: error.metaErrorSubcode,
                message: error.message,
              },
              error.isRetryable,
              attempt,
              options.maxAttempts || this.defaultOptions.maxAttempts,
            );
          }

          // Call user-provided onRetry if exists
          if (options.onRetry) {
            await options.onRetry(attempt, error);
          }
        },
      },
    );
  }

  /**
   * Batch retry - execute multiple operations with retry logic
   * Useful for bulk operations where some items may fail
   */
  async executeBatchWithRetry<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    context: Omit<RetryContext, 'operation'>,
    options: RetryOptions = {},
  ): Promise<{
    successful: Array<{ item: T; result: R }>;
    failed: Array<{ item: T; error: any }>;
  }> {
    const results = {
      successful: [] as Array<{ item: T; result: R }>,
      failed: [] as Array<{ item: T; error: any }>,
    };

    for (const item of items) {
      try {
        const result = await this.executeWithRetry(
          () => operation(item),
          {
            ...context,
            operation: `batch-operation-item`,
          },
          options,
        );

        results.successful.push({ item, result });
      } catch (error) {
        results.failed.push({ item, error });
      }
    }

    // Log batch results
    await this.errorLogger.logBatchOperation(
      'batch-retry-operation',
      {
        total: items.length,
        successful: results.successful.length,
        failed: results.failed.length,
        errors: results.failed.map(f => ({
          item: JSON.stringify(f.item),
          error: f.error.message,
        })),
      },
      context,
    );

    return results;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    // Check if it's a MetaApiException with retryable flag
    if (error instanceof MetaApiException) {
      return error.isRetryable;
    }

    // Check error code against retryable list
    if (error.errorCode) {
      return retryableErrors.includes(error.errorCode);
    }

    // Check error name
    if (error.name) {
      return retryableErrors.includes(error.name);
    }

    // Check HTTP status codes
    if (error.status) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.status);
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(
    attempt: number,
    config: Required<RetryOptions>,
  ): number {
    const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
    
    return Math.min(delay + jitter, config.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a circuit breaker for an operation
   * Prevents repeated calls to failing services
   */
  createCircuitBreaker(
    name: string,
    options: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
      monitoringPeriodMs?: number;
    } = {},
  ): CircuitBreaker {
    return new CircuitBreaker(name, options, this.logger);
  }
}

/**
 * Circuit Breaker implementation
 * Prevents cascading failures by stopping calls to failing services
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  private successCount = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly monitoringPeriodMs: number;

  constructor(
    private readonly name: string,
    options: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
      monitoringPeriodMs?: number;
    },
    private readonly logger: Logger,
  ) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 60000; // 1 minute
    this.monitoringPeriodMs = options.monitoringPeriodMs || 10000; // 10 seconds
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    this.checkReset();

    // If circuit is open, reject immediately
    if (this.state === 'OPEN') {
      throw new Error(
        `Circuit breaker '${this.name}' is OPEN. Service is temporarily unavailable.`,
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      // If we're in half-open state and operation succeeded, close the circuit
      this.logger.log(`Circuit breaker '${this.name}' closing after successful test`);
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.failureThreshold) {
      this.logger.warn(
        `Circuit breaker '${this.name}' opening after ${this.failureCount} failures`,
      );
      this.state = 'OPEN';
    }
  }

  /**
   * Check if circuit should be reset to half-open
   */
  private checkReset(): void {
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();

      if (timeSinceLastFailure >= this.resetTimeoutMs) {
        this.logger.log(
          `Circuit breaker '${this.name}' entering HALF_OPEN state for testing`,
        );
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      }
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    successCount: number;
    lastFailureTime?: Date;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.logger.log(`Circuit breaker '${this.name}' manually reset`);
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}
