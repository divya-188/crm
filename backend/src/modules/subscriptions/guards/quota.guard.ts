import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QUOTA_RESOURCE_KEY } from '../decorators/quota.decorator';
import { QuotaEnforcementService } from '../services/quota-enforcement.service';

/**
 * Guard that enforces quota limits on resource creation endpoints
 * Extracts tenant ID and resource type from request and checks against subscription limits
 */
@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly quotaEnforcementService: QuotaEnforcementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the resource type from the decorator metadata
    const resourceType = this.reflector.get<string>(
      QUOTA_RESOURCE_KEY,
      context.getHandler(),
    );

    // If no resource type is specified, allow the request
    if (!resourceType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated and has tenant information
    if (!user || !user.tenantId) {
      throw new ForbiddenException('User authentication required');
    }

    try {
      // Check quota based on resource type
      await this.quotaEnforcementService.checkQuota(user.tenantId, resourceType);
      return true;
    } catch (error) {
      // Re-throw with enhanced error details including upgrade URL
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: error.message,
          details: {
            resourceType,
            upgradeUrl: '/subscription-plans',
          },
        });
      }
      throw error;
    }
  }
}
