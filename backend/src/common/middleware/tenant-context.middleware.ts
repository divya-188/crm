import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    // Extract tenant ID from JWT token (set by auth guard)
    const user = (req as any).user;
    if (user && user.tenantId) {
      req.tenantId = user.tenantId;
    }

    // Alternative: Extract from subdomain
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
        // Store subdomain for tenant lookup
        (req as any).subdomain = subdomain;
      }
    }

    next();
  }
}
