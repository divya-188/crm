import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../../../common/services/session.service';
import { SecuritySettingsService } from '../../super-admin/services/security-settings.service';

@Injectable()
export class SessionIdleGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private securitySettingsService: SecuritySettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      return false;
    }

    // Get security settings
    const securityConfig = await this.securitySettingsService.getSettings();
    const idleTimeout = securityConfig.sessionManagement.idleTimeout;

    // Check if session is idle
    const isIdle = await this.sessionService.isSessionIdle(user.userId, idleTimeout);

    if (isIdle) {
      // Delete the idle session
      await this.sessionService.deleteSession(user.userId);
      throw new UnauthorizedException('Session expired due to inactivity');
    }

    // Refresh session activity
    await this.sessionService.updateSession(user.userId, {
      lastActivity: Date.now(),
    }, securityConfig.sessionManagement.sessionTimeout);

    return true;
  }
}
