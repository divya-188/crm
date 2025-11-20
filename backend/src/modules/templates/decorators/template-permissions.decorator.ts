import { SetMetadata } from '@nestjs/common';
import { TemplatePermission } from '../guards/template-permissions.guard';

export const TEMPLATE_PERMISSIONS_KEY = 'template_permissions';

/**
 * Decorator to specify required template permissions for a route
 * 
 * Usage:
 * @TemplatePermissions(TemplatePermission.CREATE, TemplatePermission.SUBMIT)
 * 
 * Requirement 17.1: Role-based permissions for template operations
 */
export const TemplatePermissions = (...permissions: TemplatePermission[]) =>
  SetMetadata(TEMPLATE_PERMISSIONS_KEY, permissions);
