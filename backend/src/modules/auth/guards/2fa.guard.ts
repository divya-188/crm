import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecuritySettingsService } from '../../super-admin/services/security-settings.service';
import { UserRole } from '../../users/entities/user.entity';

export const SKIP_2FA_KEY = 'skip2fa';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private securitySettingsService: SecuritySettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if 2FA should be skipped for this route
    const skip2FA = this.reflector.getAllAndOverride<boolean>(SKIP_2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip2FA) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Get security settings
    const securityConfig = await this.securitySettingsService.getSettings();

    // Check if 2FA is enforced
    const requires2FA =
      securityConfig.twoFactor.enforceForAll ||
      (securityConfig.twoFactor.enforceForAdmins &&
        (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN));

    if (!requires2FA) {
      return true;
    }

    // Check if user has completed 2FA
    // This assumes a 2faVerified flag is set in the JWT payload after 2FA verification
    if (!user.twoFactorVerified) {
      throw new UnauthorizedException('Two-factor authentication required');
    }

    return true;
  }
}
