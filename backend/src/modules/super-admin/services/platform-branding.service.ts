import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from '../entities/platform-settings.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';
import { WebSocketGatewayService } from '../../websocket/websocket.gateway';

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  customCSS?: string;
  companyName: string;
  tagline?: string;
}

@Injectable()
export class PlatformBrandingService {
  private readonly logger = new Logger(PlatformBrandingService.name);

  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepo: Repository<PlatformSettings>,
    private readonly cacheService: SettingsCacheService,
    private readonly auditService: SettingsAuditService,
    @Inject(forwardRef(() => WebSocketGatewayService))
    private readonly websocketGateway: WebSocketGatewayService,
  ) {}

  async getSettings(): Promise<BrandingConfig> {
    const cacheKey = 'platform:branding';
    const cached = await this.cacheService.get<BrandingConfig>(cacheKey);
    if (cached) return cached;

    const settings = await this.settingsRepo.findOne({
      where: { key: 'branding' },
    });

    if (!settings) {
      return this.getDefaultSettings();
    }

    await this.cacheService.set(cacheKey, settings.value, 3600);
    return settings.value;
  }

  async updateSettings(
    config: Partial<BrandingConfig>,
    userId: string,
  ): Promise<BrandingConfig> {
    const current = await this.getSettings();
    const updated = { ...current, ...config };

    await this.settingsRepo.upsert(
      {
        key: 'branding',
        value: updated as any,
        category: 'branding',
        updatedBy: userId,
      },
      ['key'],
    );

    await this.cacheService.invalidate('platform:branding');

    await this.auditService.log({
      userId,
      action: 'update',
      settingsType: 'branding',
      changes: config,
    });

    // Broadcast branding update to all connected clients via WebSocket
    this.logger.log('Broadcasting branding update to all clients');
    this.websocketGateway.emitBrandingUpdate(updated);

    return updated;
  }

  async generateCSS(config: BrandingConfig): Promise<string> {
    return `
      :root {
        --color-primary: ${config.colors.primary};
        --color-secondary: ${config.colors.secondary};
        --color-accent: ${config.colors.accent};
        --color-background: ${config.colors.background};
        --color-text: ${config.colors.text};
        --font-heading: ${config.fonts.heading}, sans-serif;
        --font-body: ${config.fonts.body}, sans-serif;
      }

      ${config.customCSS || ''}
    `;
  }

  private getDefaultSettings(): BrandingConfig {
    return {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      companyName: 'WhatsCRM',
      tagline: 'WhatsApp CRM Platform',
    };
  }
}
