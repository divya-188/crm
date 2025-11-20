import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';

export interface TeamSettings {
  defaultSettings?: {
    defaultUserRole?: 'agent' | 'user';
    autoAssignConversations?: boolean;
    assignmentStrategy?: 'round_robin' | 'load_balanced' | 'manual';
  };
  invitationSettings?: {
    allowSelfRegistration?: boolean;
    approvedEmailDomains?: string[];
    requireAdminApproval?: boolean;
  };
  departments?: Array<{
    id: string;
    name: string;
    description?: string;
    memberIds?: string[];
  }>;
}

@Injectable()
export class TeamSettingsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    private readonly cacheService: SettingsCacheService,
    private readonly auditService: SettingsAuditService,
  ) {}

  /**
   * Get team settings for a tenant
   */
  async getSettings(tenantId: string): Promise<TeamSettings> {
    // Check cache first
    const cacheKey = `tenant:${tenantId}:team-settings`;
    const cached = await this.cacheService.get<TeamSettings>(cacheKey);
    if (cached) {
      return cached;
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Return team settings or defaults
    const settings: TeamSettings = tenant.teamSettings || this.getDefaultSettings();

    // Cache the result
    await this.cacheService.set(cacheKey, settings, 3600); // 1 hour TTL

    return settings;
  }

  /**
   * Update team settings for a tenant
   */
  async updateSettings(
    tenantId: string,
    settings: Partial<TeamSettings>,
    userId: string,
  ): Promise<TeamSettings> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const oldSettings = tenant.teamSettings || this.getDefaultSettings();
    const newSettings: TeamSettings = {
      defaultSettings: {
        ...oldSettings.defaultSettings,
        ...settings.defaultSettings,
      },
      invitationSettings: {
        ...oldSettings.invitationSettings,
        ...settings.invitationSettings,
      },
      departments: settings.departments || oldSettings.departments || [],
    };

    // Update tenant
    tenant.teamSettings = newSettings;
    await this.tenantsRepository.save(tenant);

    // Invalidate cache
    const cacheKey = `tenant:${tenantId}:team-settings`;
    await this.cacheService.invalidate(cacheKey);

    // Audit log
    await this.auditService.log({
      action: 'update',
      settingsType: 'team_settings',
      tenantId,
      userId,
      changes: {
        old: oldSettings,
        new: newSettings,
      },
    });

    return newSettings;
  }

  /**
   * Get default role for new users
   */
  async getDefaultUserRole(tenantId: string): Promise<'agent' | 'user'> {
    const settings = await this.getSettings(tenantId);
    return settings.defaultSettings?.defaultUserRole || 'agent';
  }

  /**
   * Check if auto-assignment is enabled
   */
  async isAutoAssignEnabled(tenantId: string): Promise<boolean> {
    const settings = await this.getSettings(tenantId);
    return settings.defaultSettings?.autoAssignConversations || false;
  }

  /**
   * Get assignment strategy
   */
  async getAssignmentStrategy(
    tenantId: string,
  ): Promise<'round_robin' | 'load_balanced' | 'manual'> {
    const settings = await this.getSettings(tenantId);
    return settings.defaultSettings?.assignmentStrategy || 'manual';
  }

  /**
   * Check if email domain is approved for self-registration
   */
  async isEmailDomainApproved(tenantId: string, email: string): Promise<boolean> {
    const settings = await this.getSettings(tenantId);
    
    if (!settings.invitationSettings?.allowSelfRegistration) {
      return false;
    }

    const domain = email.split('@')[1];
    const approvedDomains = settings.invitationSettings.approvedEmailDomains || [];
    
    return approvedDomains.includes(domain);
  }

  /**
   * Check if admin approval is required for new registrations
   */
  async requiresAdminApproval(tenantId: string): Promise<boolean> {
    const settings = await this.getSettings(tenantId);
    return settings.invitationSettings?.requireAdminApproval || false;
  }

  /**
   * Add a department
   */
  async addDepartment(
    tenantId: string,
    department: { name: string; description?: string },
    userId: string,
  ): Promise<TeamSettings> {
    const settings = await this.getSettings(tenantId);
    
    const newDepartment = {
      id: `dept_${Date.now()}`,
      name: department.name,
      description: department.description,
      memberIds: [],
    };

    const departments = settings.departments || [];
    departments.push(newDepartment);

    return this.updateSettings(
      tenantId,
      { departments },
      userId,
    );
  }

  /**
   * Update a department
   */
  async updateDepartment(
    tenantId: string,
    departmentId: string,
    updates: { name?: string; description?: string; memberIds?: string[] },
    userId: string,
  ): Promise<TeamSettings> {
    const settings = await this.getSettings(tenantId);
    const departments = settings.departments || [];
    
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) {
      throw new NotFoundException('Department not found');
    }

    departments[departmentIndex] = {
      ...departments[departmentIndex],
      ...updates,
    };

    return this.updateSettings(
      tenantId,
      { departments },
      userId,
    );
  }

  /**
   * Delete a department
   */
  async deleteDepartment(
    tenantId: string,
    departmentId: string,
    userId: string,
  ): Promise<TeamSettings> {
    const settings = await this.getSettings(tenantId);
    const departments = (settings.departments || []).filter(d => d.id !== departmentId);

    return this.updateSettings(
      tenantId,
      { departments },
      userId,
    );
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): TeamSettings {
    return {
      defaultSettings: {
        defaultUserRole: 'agent',
        autoAssignConversations: false,
        assignmentStrategy: 'manual',
      },
      invitationSettings: {
        allowSelfRegistration: false,
        approvedEmailDomains: [],
        requireAdminApproval: true,
      },
      departments: [],
    };
  }

  /**
   * Invalidate cache for team settings
   */
  async invalidateCache(tenantId: string): Promise<void> {
    const cacheKey = `tenant:${tenantId}:team-settings`;
    await this.cacheService.invalidate(cacheKey);
  }
}
