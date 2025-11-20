import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';
import { PlatformBrandingService } from '../../super-admin/services/platform-branding.service';

export interface TenantBranding {
  logoUrl?: string;
  faviconUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    fontFamily?: string;
    headingFont?: string;
    fontSize?: Record<string, string>;
  };
  customCss?: string;
  companyName?: string;
  tagline?: string;
}

@Injectable()
export class TenantBrandingService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    private readonly cacheService: SettingsCacheService,
    private readonly auditService: SettingsAuditService,
    private readonly platformBrandingService: PlatformBrandingService,
  ) {}

  /**
   * Get branding for a tenant with fallback to platform branding
   */
  async getBranding(tenantId: string): Promise<TenantBranding> {
    // Check cache first
    const cacheKey = `tenant:${tenantId}:branding`;
    const cached = await this.cacheService.get<TenantBranding>(cacheKey);
    if (cached) {
      return cached;
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    let branding: TenantBranding;

    // If white-label is enabled and tenant has branding, use it
    if (tenant.whiteLabelEnabled && tenant.branding) {
      branding = tenant.branding;
    } else {
      // Fall back to platform branding
      const platformBranding = await this.platformBrandingService.getSettings();
      // Map platform branding to tenant branding format
      branding = {
        logoUrl: platformBranding.logo,
        faviconUrl: platformBranding.favicon,
        colors: platformBranding.colors,
        typography: {
          fontFamily: platformBranding.fonts.body,
          headingFont: platformBranding.fonts.heading,
        },
        customCss: platformBranding.customCSS,
        companyName: platformBranding.companyName,
        tagline: platformBranding.tagline,
      };
    }

    // Cache the result
    await this.cacheService.set(cacheKey, branding, 3600); // 1 hour TTL

    return branding;
  }

  /**
   * Update tenant branding (only if white-label is enabled)
   */
  async updateBranding(
    tenantId: string,
    branding: Partial<TenantBranding>,
    userId: string,
  ): Promise<TenantBranding> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if white-label is enabled
    if (!tenant.whiteLabelEnabled) {
      throw new ForbiddenException(
        'White-label branding is not enabled for this tenant. Please upgrade your subscription plan.',
      );
    }

    const oldBranding = tenant.branding || {};
    const newBranding = {
      ...oldBranding,
      ...branding,
      colors: {
        ...oldBranding.colors,
        ...branding.colors,
      },
      typography: {
        ...oldBranding.typography,
        ...branding.typography,
      },
    };

    // Update tenant
    tenant.branding = newBranding;
    await this.tenantsRepository.save(tenant);

    // Invalidate cache
    const cacheKey = `tenant:${tenantId}:branding`;
    await this.cacheService.invalidate(cacheKey);

    // Audit log
    await this.auditService.log({
      action: 'update',
      settingsType: 'tenant_branding',
      tenantId,
      userId,
      changes: {
        old: oldBranding,
        new: newBranding,
      },
    });

    return newBranding;
  }

  /**
   * Check if white-label is enabled for a tenant
   */
  async isWhiteLabelEnabled(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'whiteLabelEnabled'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant.whiteLabelEnabled;
  }

  /**
   * Generate CSS from branding settings
   */
  generateCss(branding: TenantBranding): string {
    let css = ':root {\n';

    // Colors
    if (branding.colors) {
      if (branding.colors.primary) css += `  --primary: ${branding.colors.primary};\n`;
      if (branding.colors.secondary) css += `  --secondary: ${branding.colors.secondary};\n`;
      if (branding.colors.accent) css += `  --accent: ${branding.colors.accent};\n`;
      if (branding.colors.background) css += `  --background: ${branding.colors.background};\n`;
      if (branding.colors.text) css += `  --text: ${branding.colors.text};\n`;
    }

    // Typography
    if (branding.typography) {
      if (branding.typography.fontFamily) {
        css += `  --font-family: ${branding.typography.fontFamily};\n`;
      }
      if (branding.typography.headingFont) {
        css += `  --heading-font: ${branding.typography.headingFont};\n`;
      }
      if (branding.typography.fontSize) {
        Object.entries(branding.typography.fontSize).forEach(([key, value]) => {
          css += `  --font-size-${key}: ${value};\n`;
        });
      }
    }

    css += '}\n\n';

    // Custom CSS
    if (branding.customCss) {
      css += branding.customCss;
    }

    return css;
  }

  /**
   * Invalidate branding cache for a tenant
   */
  async invalidateCache(tenantId: string): Promise<void> {
    const cacheKey = `tenant:${tenantId}:branding`;
    await this.cacheService.invalidate(cacheKey);
  }

  /**
   * Invalidate all tenant branding caches (called when platform branding changes)
   */
  async invalidateAllCaches(): Promise<void> {
    await this.cacheService.invalidatePattern('tenant:*:branding');
  }
}
