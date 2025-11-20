import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from '../entities/platform-settings.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';

export interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
    preventReuse: number;
  };
  sessionManagement: {
    maxSessions: number;
    sessionTimeout: number;
    idleTimeout: number;
    requireReauthForSensitive: boolean;
  };
  twoFactor: {
    enforceForAdmins: boolean;
    enforceForAll: boolean;
    allowedMethods: string[];
  };
  auditLog: {
    retentionDays: number;
    logFailedLogins: boolean;
    logPasswordChanges: boolean;
    logSettingsChanges: boolean;
  };
  ipWhitelist: {
    enabled: boolean;
    addresses: string[];
  };
}

@Injectable()
export class SecuritySettingsService {
  private readonly logger = new Logger(SecuritySettingsService.name);

  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepo: Repository<PlatformSettings>,
    private readonly cacheService: SettingsCacheService,
    private readonly auditService: SettingsAuditService,
  ) {}

  async getSettings(): Promise<SecurityConfig> {
    const cacheKey = 'platform:security';
    const cached = await this.cacheService.get<SecurityConfig>(cacheKey);
    if (cached) return cached;

    const settings = await this.settingsRepo.findOne({
      where: { key: 'security' },
    });

    if (!settings) {
      return this.getDefaultSettings();
    }

    await this.cacheService.set(cacheKey, settings.value, 3600);
    return settings.value;
  }

  async updateSettings(
    config: Partial<SecurityConfig>,
    userId: string,
  ): Promise<SecurityConfig> {
    const current = await this.getSettings();
    const updated = { ...current, ...config };

    await this.settingsRepo.upsert(
      {
        key: 'security',
        value: updated as any,
        category: 'security',
        updatedBy: userId,
      },
      ['key'],
    );

    await this.cacheService.invalidate('platform:security');

    await this.auditService.log({
      userId,
      action: 'update',
      settingsType: 'security',
      changes: config,
    });

    return updated;
  }

  async validatePassword(password: string): Promise<{ valid: boolean; errors: string[] }> {
    const config = await this.getSettings();
    const errors: string[] = [];

    if (password.length < config.passwordPolicy.minLength) {
      errors.push(`Password must be at least ${config.passwordPolicy.minLength} characters`);
    }

    if (config.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getDefaultSettings(): SecurityConfig {
    return {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        preventReuse: 5,
      },
      sessionManagement: {
        maxSessions: 3,
        sessionTimeout: 86400, // 24 hours
        idleTimeout: 3600, // 1 hour
        requireReauthForSensitive: true,
      },
      twoFactor: {
        enforceForAdmins: true,
        enforceForAll: false,
        allowedMethods: ['totp', 'sms', 'email'],
      },
      auditLog: {
        retentionDays: 90,
        logFailedLogins: true,
        logPasswordChanges: true,
        logSettingsChanges: true,
      },
      ipWhitelist: {
        enabled: false,
        addresses: [],
      },
    };
  }
}
