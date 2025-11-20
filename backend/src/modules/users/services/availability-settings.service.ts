import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';

export enum AgentStatus {
  AVAILABLE = 'available',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export interface WorkingHours {
  monday?: { enabled: boolean; start: string; end: string };
  tuesday?: { enabled: boolean; start: string; end: string };
  wednesday?: { enabled: boolean; start: string; end: string };
  thursday?: { enabled: boolean; start: string; end: string };
  friday?: { enabled: boolean; start: string; end: string };
  saturday?: { enabled: boolean; start: string; end: string };
  sunday?: { enabled: boolean; start: string; end: string };
}

export interface BreakSchedule {
  id: string;
  name: string;
  start: string;
  end: string;
  enabled: boolean;
}

export interface AvailabilitySettings {
  status: AgentStatus;
  workingHours?: WorkingHours;
  breaks?: BreakSchedule[];
  autoReply?: {
    enabled: boolean;
    awayMessage?: string;
    offlineMessage?: string;
  };
  autoStatusChange?: {
    enabled: boolean;
    offlineAfterMinutes?: number;
  };
}

@Injectable()
export class AvailabilitySettingsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private cacheService: SettingsCacheService,
    private auditService: SettingsAuditService,
  ) {}

  async getAvailabilitySettings(userId: string): Promise<AvailabilitySettings> {
    const cacheKey = `availability:${userId}`;
    const cached = await this.cacheService.get<AvailabilitySettings>(cacheKey);
    if (cached) return cached;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = (user.preferences as any)?.availability || this.getDefaultSettings();
    await this.cacheService.set(cacheKey, settings);
    return settings;
  }

  async updateAvailabilitySettings(
    userId: string,
    settings: Partial<AvailabilitySettings>,
    requestUserId: string,
  ): Promise<AvailabilitySettings> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPreferences = (user.preferences as any) || {};
    const currentAvailability = currentPreferences.availability || this.getDefaultSettings();
    const updatedAvailability = { ...currentAvailability, ...settings };

    user.preferences = {
      ...currentPreferences,
      availability: updatedAvailability,
    } as any;

    await this.usersRepository.save(user);

    // Invalidate cache
    const cacheKey = `availability:${userId}`;
    await this.cacheService.invalidate(cacheKey);

    // Audit log
    await this.auditService.log({
      userId: requestUserId,
      tenantId: user.tenantId,
      settingsType: 'availability',
      action: 'update',
      changes: settings,
    });

    return updatedAvailability;
  }

  async updateStatus(userId: string, status: AgentStatus): Promise<void> {
    const settings = await this.getAvailabilitySettings(userId);
    await this.updateAvailabilitySettings(userId, { status }, userId);
  }

  async isAgentAvailable(userId: string): Promise<boolean> {
    const settings = await this.getAvailabilitySettings(userId);
    return settings.status === AgentStatus.AVAILABLE;
  }

  private getDefaultSettings(): AvailabilitySettings {
    return {
      status: AgentStatus.AVAILABLE,
      workingHours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' },
      },
      breaks: [],
      autoReply: {
        enabled: false,
        awayMessage: 'I am currently away. I will get back to you soon.',
        offlineMessage: 'I am currently offline. Please leave a message.',
      },
      autoStatusChange: {
        enabled: false,
        offlineAfterMinutes: 30,
      },
    };
  }
}
