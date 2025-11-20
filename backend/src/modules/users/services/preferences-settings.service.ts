import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';

export interface InboxPreferences {
  viewMode?: 'list' | 'compact' | 'comfortable';
  sortBy?: 'recent' | 'unread' | 'priority';
  showAvatars?: boolean;
  showPreview?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export interface ConversationPreferences {
  showTimestamps?: boolean;
  timestampFormat?: '12h' | '24h';
  showReadReceipts?: boolean;
  enterToSend?: boolean;
  showTypingIndicator?: boolean;
  messageGrouping?: boolean;
}

export interface KeyboardShortcuts {
  enabled?: boolean;
  shortcuts?: {
    newConversation?: string;
    search?: string;
    nextConversation?: string;
    prevConversation?: string;
    markAsRead?: string;
    archive?: string;
  };
}

export interface NotificationPreferences {
  desktop?: boolean;
  sound?: boolean;
  email?: boolean;
  newMessage?: boolean;
  mentions?: boolean;
  assignments?: boolean;
}

export interface UserPreferences {
  inbox?: InboxPreferences;
  conversation?: ConversationPreferences;
  keyboard?: KeyboardShortcuts;
  notifications?: NotificationPreferences;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
}

@Injectable()
export class PreferencesSettingsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private cacheService: SettingsCacheService,
    private auditService: SettingsAuditService,
  ) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = `preferences:${userId}`;
    const cached = await this.cacheService.get<UserPreferences>(cacheKey);
    if (cached) return cached;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const preferences = (user.preferences as any)?.userPreferences || this.getDefaultPreferences();
    await this.cacheService.set(cacheKey, preferences);
    return preferences;
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
    requestUserId: string,
  ): Promise<UserPreferences> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPreferences = (user.preferences as any) || {};
    const currentUserPreferences = currentPreferences.userPreferences || this.getDefaultPreferences();
    const updatedPreferences = this.deepMerge(currentUserPreferences, preferences);

    user.preferences = {
      ...currentPreferences,
      userPreferences: updatedPreferences,
    } as any;

    await this.usersRepository.save(user);

    // Invalidate cache
    const cacheKey = `preferences:${userId}`;
    await this.cacheService.invalidate(cacheKey);

    // Audit log
    await this.auditService.log({
      userId: requestUserId,
      tenantId: user.tenantId,
      settingsType: 'preferences',
      action: 'update',
      changes: preferences,
    });

    return updatedPreferences;
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      inbox: {
        viewMode: 'comfortable',
        sortBy: 'recent',
        showAvatars: true,
        showPreview: true,
        autoRefresh: true,
        refreshInterval: 30,
      },
      conversation: {
        showTimestamps: true,
        timestampFormat: '12h',
        showReadReceipts: true,
        enterToSend: true,
        showTypingIndicator: true,
        messageGrouping: true,
      },
      keyboard: {
        enabled: true,
        shortcuts: {
          newConversation: 'ctrl+n',
          search: 'ctrl+k',
          nextConversation: 'ctrl+j',
          prevConversation: 'ctrl+k',
          markAsRead: 'ctrl+m',
          archive: 'ctrl+e',
        },
      },
      notifications: {
        desktop: true,
        sound: true,
        email: false,
        newMessage: true,
        mentions: true,
        assignments: true,
      },
      theme: 'auto',
      language: 'en',
    };
  }
}
