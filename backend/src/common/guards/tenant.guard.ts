import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantsService } from '../../modules/tenants/tenants.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantsService: TenantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('No tenant context found');
    }

    // Check if tenant is active
    const isActive = await this.tenantsService.isActive(user.tenantId);
    if (!isActive) {
      throw new ForbiddenException('Tenant is not active');
    }

    return true;
  }
}
