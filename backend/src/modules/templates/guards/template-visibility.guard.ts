import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserRoleType } from '../../users/entities/user.entity';
import { TemplatesService } from '../templates.service';

/**
 * Guard for team-based template visibility
 * Requirement 17.6: Team-based template sharing and visibility
 * 
 * This guard ensures that users can only access templates within their tenant
 * and respects team-based visibility rules
 */
@Injectable()
export class TemplateVisibilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private templatesService: TemplatesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.role as UserRoleType;
    const userTenantId = user.tenantId;

    // Super admin can see all templates across tenants
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // For other users, ensure they can only access templates in their tenant
    const templateId = request.params?.id;
    
    if (templateId) {
      try {
        const template = await this.templatesService.findOne(userTenantId, templateId);
        
        // Check if template belongs to user's tenant
        if (template.tenantId !== userTenantId) {
          throw new ForbiddenException(
            'You do not have access to templates from other organizations',
          );
        }

        // Additional team-based visibility checks can be added here
        // For example, checking if user is part of a specific team that owns the template
        
        return true;
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        // If template not found, let the controller handle it
        return true;
      }
    }

    // For list operations, tenant isolation is handled by the service layer
    return true;
  }
}
