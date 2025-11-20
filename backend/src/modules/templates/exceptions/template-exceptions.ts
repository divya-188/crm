import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception class for all template-related errors
 * Provides consistent error structure and logging
 */
export class TemplateException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly errorCode?: string,
    public readonly field?: string,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode,
        message,
        errorCode,
        field,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

/**
 * Template validation exception
 * Requirement 20.1: Field-level error indicators
 * Requirement 20.2: User-friendly error messages
 */
export class TemplateValidationException extends TemplateException {
  constructor(
    message: string,
    public readonly errors: Array<{
      field: string;
      message: string;
      code: string;
      value?: any;
    }>,
    public readonly warnings?: Array<{
      field: string;
      message: string;
      code: string;
    }>,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_VALIDATION_ERROR',
      undefined,
      { errors, warnings },
    );
  }
}

/**
 * Template not found exception
 * Requirement 20.2: User-friendly error messages
 */
export class TemplateNotFoundException extends TemplateException {
  constructor(templateId: string, tenantId?: string) {
    const message = tenantId
      ? `Template with ID '${templateId}' not found for tenant '${tenantId}'`
      : `Template with ID '${templateId}' not found`;
    
    super(
      message,
      HttpStatus.NOT_FOUND,
      'TEMPLATE_NOT_FOUND',
      undefined,
      { templateId, tenantId },
    );
  }
}

/**
 * Template status exception
 * Thrown when an operation is not allowed for the current template status
 */
export class TemplateStatusException extends TemplateException {
  constructor(
    message: string,
    currentStatus: string,
    requiredStatus?: string | string[],
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'INVALID_TEMPLATE_STATUS',
      'status',
      {
        currentStatus,
        requiredStatus,
      },
    );
  }
}

/**
 * Template submission exception
 * Thrown when template submission to Meta API fails
 */
export class TemplateSubmissionException extends TemplateException {
  constructor(
    message: string,
    public readonly metaError?: {
      code?: number;
      subcode?: number;
      message?: string;
      type?: string;
    },
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_SUBMISSION_ERROR',
      undefined,
      { metaError },
    );
  }
}

/**
 * Meta API exception
 * Requirement 20.6: Retry mechanisms for API failures
 * Thrown when Meta API calls fail
 */
export class MetaApiException extends TemplateException {
  constructor(
    message: string,
    public readonly metaErrorCode?: number,
    public readonly metaErrorSubcode?: number,
    public readonly isRetryable: boolean = false,
    public readonly retryAfter?: number,
  ) {
    const statusCode = isRetryable
      ? HttpStatus.SERVICE_UNAVAILABLE
      : HttpStatus.BAD_GATEWAY;

    super(
      message,
      statusCode,
      'META_API_ERROR',
      undefined,
      {
        metaErrorCode,
        metaErrorSubcode,
        isRetryable,
        retryAfter,
      },
    );
  }

  /**
   * Determine if the error is retryable based on Meta error codes
   */
  static isRetryableError(errorCode?: number): boolean {
    const retryableErrors = [
      1, // API Unknown
      2, // API Service
      4, // API Too Many Calls
      17, // API User Too Many Calls
      32, // API Temporarily Blocked
      80007, // Rate limit issues
      130429, // Rate limit issues
      368, // Temporarily blocked
      613, // Calls to this API have exceeded the rate limit
    ];

    return errorCode ? retryableErrors.includes(errorCode) : false;
  }
}

/**
 * Template duplicate name exception
 * Thrown when attempting to create a template with a duplicate name
 */
export class TemplateDuplicateNameException extends TemplateException {
  constructor(templateName: string, tenantId: string) {
    super(
      `Template with name '${templateName}' already exists`,
      HttpStatus.CONFLICT,
      'TEMPLATE_DUPLICATE_NAME',
      'name',
      { templateName, tenantId },
    );
  }
}

/**
 * Template in use exception
 * Requirement 19.7: Prevent deletion of templates in active campaigns
 * Thrown when attempting to delete a template that is in use
 */
export class TemplateInUseException extends TemplateException {
  constructor(
    templateId: string,
    usageContext: {
      activeCampaigns?: Array<{ id: string; name: string }>;
      reason: string;
    },
  ) {
    super(
      `Cannot delete template: ${usageContext.reason}`,
      HttpStatus.CONFLICT,
      'TEMPLATE_IN_USE',
      undefined,
      {
        templateId,
        ...usageContext,
      },
    );
  }
}

/**
 * Template media upload exception
 * Thrown when media upload fails
 */
export class TemplateMediaException extends TemplateException {
  constructor(
    message: string,
    public readonly mediaType?: string,
    public readonly fileSize?: number,
    public readonly maxSize?: number,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_MEDIA_ERROR',
      'media',
      {
        mediaType,
        fileSize,
        maxSize,
      },
    );
  }
}

/**
 * Template permission exception
 * Thrown when user lacks permission for template operation
 */
export class TemplatePermissionException extends TemplateException {
  constructor(
    operation: string,
    userId?: string,
    requiredPermission?: string,
  ) {
    super(
      `Insufficient permissions to ${operation} template`,
      HttpStatus.FORBIDDEN,
      'TEMPLATE_PERMISSION_DENIED',
      undefined,
      {
        operation,
        userId,
        requiredPermission,
      },
    );
  }
}

/**
 * Template import exception
 * Thrown when template import fails
 */
export class TemplateImportException extends TemplateException {
  constructor(
    message: string,
    public readonly failedTemplates?: Array<{
      name: string;
      error: string;
      line?: number;
    }>,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_IMPORT_ERROR',
      undefined,
      { failedTemplates },
    );
  }
}

/**
 * Template export exception
 * Thrown when template export fails
 */
export class TemplateExportException extends TemplateException {
  constructor(message: string, templateIds?: string[]) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'TEMPLATE_EXPORT_ERROR',
      undefined,
      { templateIds },
    );
  }
}

/**
 * Template test send exception
 * Thrown when template test send fails
 */
export class TemplateTestException extends TemplateException {
  constructor(
    message: string,
    public readonly phoneNumber?: string,
    public readonly metaError?: any,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_TEST_ERROR',
      'phoneNumber',
      {
        phoneNumber,
        metaError,
      },
    );
  }
}

/**
 * Template analytics exception
 * Thrown when analytics operations fail
 */
export class TemplateAnalyticsException extends TemplateException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'TEMPLATE_ANALYTICS_ERROR',
      undefined,
      details,
    );
  }
}

/**
 * Template version exception
 * Thrown when version operations fail
 */
export class TemplateVersionException extends TemplateException {
  constructor(
    message: string,
    currentVersion?: number,
    details?: any,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_VERSION_ERROR',
      'version',
      {
        currentVersion,
        ...details,
      },
    );
  }
}

/**
 * Template archive exception
 * Thrown when archive/restore operations fail
 */
export class TemplateArchiveException extends TemplateException {
  constructor(message: string, templateId: string, isArchived: boolean) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_ARCHIVE_ERROR',
      undefined,
      {
        templateId,
        isArchived,
      },
    );
  }
}
