import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';
import { EncryptionService } from '../../../common/services/encryption.service';

export interface IntegrationSettings {
  oauth?: {
    google?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };
    microsoft?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };
  };
  apiKeys?: {
    enabled: boolean;
    maxKeys?: number;
  };
  webhooks?: {
    enabled: boolean;
    maxWebhooks?: number;
  };
  thirdParty?: {
    zapier?: {
      enabled: boolean;
      apiKey?: string;
    };
    slack?: {
      enabled: boolean;
      webhookUrl?: string;
    };
  };
}

@Injectable()
export class IntegrationsSettingsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    private cacheService: SettingsCacheService,
    private auditService: SettingsAuditService,
    private encryptionService: EncryptionService,
  ) {}

  async getIntegrationSettings(tenantId: string): Promise<IntegrationSettings> {
    const cacheKey = `integrations:${tenantId}`;
    const cached = await this.cacheService.get<IntegrationSettings>(cacheKey);
    if (cached) return cached;

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const settings = (tenant.integrationSettings as IntegrationSettings) || this.getDefaultSettings();
    
    // Decrypt sensitive fields
    if (settings.oauth?.google?.clientSecret) {
      settings.oauth.google.clientSecret = this.encryptionService.decrypt(
        settings.oauth.google.clientSecret,
      );
    }
    if (settings.oauth?.microsoft?.clientSecret) {
      settings.oauth.microsoft.clientSecret = this.encryptionService.decrypt(
        settings.oauth.microsoft.clientSecret,
      );
    }
    if (settings.thirdParty?.zapier?.apiKey) {
      settings.thirdParty.zapier.apiKey = this.encryptionService.decrypt(
        settings.thirdParty.zapier.apiKey,
      );
    }

    await this.cacheService.set(cacheKey, settings);
    return settings;
  }

  async updateIntegrationSettings(
    tenantId: string,
    settings: Partial<IntegrationSettings>,
    userId: string,
  ): Promise<IntegrationSettings> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentSettings = (tenant.integrationSettings as IntegrationSettings) || this.getDefaultSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    // Encrypt sensitive fields before saving
    if (updatedSettings.oauth?.google?.clientSecret) {
      updatedSettings.oauth.google.clientSecret = this.encryptionService.encrypt(
        updatedSettings.oauth.google.clientSecret,
      );
    }
    if (updatedSettings.oauth?.microsoft?.clientSecret) {
      updatedSettings.oauth.microsoft.clientSecret = this.encryptionService.encrypt(
        updatedSettings.oauth.microsoft.clientSecret,
      );
    }
    if (updatedSettings.thirdParty?.zapier?.apiKey) {
      updatedSettings.thirdParty.zapier.apiKey = this.encryptionService.encrypt(
        updatedSettings.thirdParty.zapier.apiKey,
      );
    }

    tenant.integrationSettings = updatedSettings as any;
    await this.tenantsRepository.save(tenant);

    // Invalidate cache
    const cacheKey = `integrations:${tenantId}`;
    await this.cacheService.invalidate(cacheKey);

    // Audit log
    await this.auditService.log({
      userId,
      tenantId,
      settingsType: 'integrations',
      action: 'update',
      changes: settings,
    });

    return this.getIntegrationSettings(tenantId);
  }

  private getDefaultSettings(): IntegrationSettings {
    return {
      oauth: {
        google: { enabled: false },
        microsoft: { enabled: false },
      },
      apiKeys: {
        enabled: true,
        maxKeys: 10,
      },
      webhooks: {
        enabled: true,
        maxWebhooks: 20,
      },
      thirdParty: {
        zapier: { enabled: false },
        slack: { enabled: false },
      },
    };
  }
}
