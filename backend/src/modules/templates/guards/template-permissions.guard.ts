import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserRoleType } from '../../users/entities/user.entity';
import { TEMPLATE_PERMISSIONS_KEY } from '../decorators/template-permissions.decorator';
import { TemplatesService } from '../templates.service';
import { TemplateStatus } from '../entities/template.entity';

export enum TemplatePermission {
  CREATE = 'template:create',
  READ = 'template:read',
  UPDATE = 'template:update',
  DELETE = 'template:delete',
  SUBMIT = 'template:submit',
  APPROVE = 'template:approve',
  ARCHIVE = 'template:archive',
  EXPORT = 'template:export',
  IMPORT = 'template:import',
}

/**
 * Guard for template-specific permissions
 * Requirement 17.1: Role-based permissions for template operations
 * Requirement 17.2: Restricting template submission to specific user roles
 * Requirement 17.5: Read-only mode for specific roles
 */
@Injectable()
export class TemplatePermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private templatesService: TemplatesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<TemplatePermission[]>(
      TEMPLATE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has required permissions based on role
    const hasPermission = await this.checkPermissions(
      user,
      requiredPermissions,
      request,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `User does not have required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Check if user has required permissions based on role and context
   */
  private async checkPermissions(
    user: any,
    requiredPermissions: TemplatePermission[],
    request: any,
  ): Promise<boolean> {
    const userRole = user.role as UserRoleType;

    // Super admin has all permissions
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await this.hasPermission(user, permission, request);
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has a specific permission
   * Implements role-based access control for templates
   */
  private async hasPermission(
    user: any,
    permission: TemplatePermission,
    request: any,
  ): Promise<boolean> {
    const userRole = user.role as UserRoleType;

    switch (permission) {
      case TemplatePermission.CREATE:
        // Admin and Agent can create templates
        return ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT] as UserRoleType[]).includes(userRole);

      case TemplatePermission.READ:
        // All authenticated users can read templates
        return true;

      case TemplatePermission.UPDATE:
        // Admin and Agent can update templates
        // Additional check: only template creator or admin can update
        if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT] as UserRoleType[]).includes(userRole)) {
          return false;
        }
        
        // If template ID is in params, check ownership
        const templateId = request.params?.id;
        if (templateId) {
          return await this.checkTemplateOwnership(user, templateId, request);
        }
        
        return true;

      case TemplatePermission.DELETE:
        // Only Admin and Super Admin can delete templates
        return ([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRoleType[]).includes(userRole);

      case TemplatePermission.SUBMIT:
        // Requirement 17.2: Restrict template submission to specific roles
        // Only Admin and Super Admin can submit templates for approval
        return ([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRoleType[]).includes(userRole);

      case TemplatePermission.APPROVE:
        // Only Super Admin can approve templates
        return userRole === UserRole.SUPER_ADMIN;

      case TemplatePermission.ARCHIVE:
        // Admin and Super Admin can archive templates
        return ([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRoleType[]).includes(userRole);

      case TemplatePermission.EXPORT:
        // Admin, Agent, and Super Admin can export templates
        return ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT] as UserRoleType[]).includes(userRole);

      case TemplatePermission.IMPORT:
        // Only Admin and Super Admin can import templates
        return ([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRoleType[]).includes(userRole);

      default:
        return false;
    }
  }

  /**
   * Check if user owns the template or has admin privileges
   * Requirement 17.5: Read-only mode for specific roles
   */
  private async checkTemplateOwnership(
    user: any,
    templateId: string,
    request: any,
  ): Promise<boolean> {
    const userRole = user.role as UserRoleType;

    // Super Admin and Admin can modify any template
    if (([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRoleType[]).includes(userRole)) {
      return true;
    }

    try {
      // Get template to check ownership
      const tenantId = request.user.tenantId;
      const template = await this.templatesService.findOne(tenantId, templateId);

      // Agent can only modify their own templates
      if (userRole === UserRole.AGENT) {
        return template.createdByUserId === user.id;
      }

      return false;
    } catch (error) {
      // If template not found, let the controller handle it
      return false;
    }
  }
}
