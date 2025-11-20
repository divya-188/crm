import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = response.message || exception.message;
        errorCode = response.errorCode || this.getErrorCodeFromStatus(statusCode);
        details = response.details;
      } else {
        message = exceptionResponse as string;
        errorCode = this.getErrorCodeFromStatus(statusCode);
      }
    } else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      errorCode = 'DATABASE_ERROR';
      details = this.sanitizeDatabaseError(exception);
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    }

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development' && stack) {
      details = { ...details, stack };
    }

    return {
      statusCode,
      message,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  private sanitizeDatabaseError(error: QueryFailedError): any {
    const dbError = error as any;
    
    // PostgreSQL error codes
    if (dbError.code === '23505') {
      return { type: 'UNIQUE_VIOLATION', constraint: dbError.constraint };
    }
    if (dbError.code === '23503') {
      return { type: 'FOREIGN_KEY_VIOLATION', constraint: dbError.constraint };
    }
    if (dbError.code === '23502') {
      return { type: 'NOT_NULL_VIOLATION', column: dbError.column };
    }

    return {
      type: 'DATABASE_ERROR',
      code: dbError.code,
    };
  }

  private logError(exception: unknown, request: Request, errorResponse: any) {
    const { statusCode, message, errorCode, details } = errorResponse;
    const { method, url, ip, headers } = request;

    const logContext = {
      statusCode,
      errorCode,
      message,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      userId: (request as any).user?.id,
      tenantId: (request as any).user?.tenantId,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `Server Error: ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `Client Error: ${message}`,
        JSON.stringify({ ...logContext, details }),
      );
    }
  }
}
