import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private apiKeysService: ApiKeysService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Validate API key
    const validatedKey = await this.apiKeysService.validateApiKey(apiKey);

    if (!validatedKey) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Check permissions if specified
    const requiredPermissions = this.reflector.get<{ resource: string; action: string }>(
      'apiPermissions',
      context.getHandler(),
    );

    if (requiredPermissions) {
      const hasPermission = this.apiKeysService.hasPermission(
        validatedKey,
        requiredPermissions.resource,
        requiredPermissions.action,
      );

      if (!hasPermission) {
        throw new UnauthorizedException('Insufficient permissions');
      }
    }

    // Attach API key and tenant to request
    request.apiKey = validatedKey;
    request.tenantId = validatedKey.tenantId;

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Check Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }
}
