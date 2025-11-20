import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantBrandingService } from '../../modules/tenants/services/tenant-branding.service';

@Injectable()
export class BrandingMiddleware implements NestMiddleware {
  constructor(private readonly brandingService: TenantBrandingService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Only inject branding for authenticated requests with tenantId
    const user = req['user'] as any;
    if (user && user.tenantId) {
      try {
        const branding = await this.brandingService.getBranding(user.tenantId);
        req['branding'] = branding;
      } catch (error) {
        // Silently fail - branding is not critical
        console.error('Failed to load branding:', error.message);
      }
    }

    next();
  }
}
