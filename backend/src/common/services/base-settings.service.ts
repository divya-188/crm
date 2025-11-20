import { Logger } from '@nestjs/common';
import { SettingsCacheService } from './settings-cache.service';
import { SettingsAuditService } from './settings-audit.service';
import { WebSocketGatewayService } from '../../modules/websocket/websocket.gateway';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export abstract class BaseSettingsService<T> {
  protected abstract readonly logger: Logger;
  protected abstract readonly settingsType: string;
  protected abstract readonly supportsTest: boolean;

  constructor(
    protected readonly cacheService: SettingsCacheService,
    protected readonly auditService: SettingsAuditService,
    protected readonly websocketGateway?: WebSocketGatewayService,
  ) {}

  /**
   * Validate settings before saving
   * @param settings Settings to validate
   * @returns Validation result
   */
  abstract validate(settings: T): Promise<ValidationResult>;

  /**
   * Apply settings to the system
   * @param settings Settings to apply
   */
  abstract apply(settings: T): Promise<void>;

  /**
   * Test settings connection/configuration (optional)
   * @param settings Settings to test
   * @returns Test result
   */
  async test(settings: T): Promise<TestResult> {
    if (!this.supportsTest) {
      return {
        success: false,
        error: 'Test not supported for this settings type',
      };
    }
    throw new Error('Test method not implemented');
  }

  /**
   * Save settings with full workflow
   * @param settings Settings to save
   * @param userId User making the change
   * @param tenantId Tenant ID (if applicable)
   * @param ipAddress IP address of the request
   * @param userAgent User agent of the request
   * @returns Saved settings
   */
  async save(
    settings: T,
    userId?: string,
    tenantId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<T> {
    const oldSettings = await this.getCurrent();

    try {
      // 1. Validate
      this.logger.log(`Validating ${this.settingsType} settings...`);
      const validation = await this.validate(settings);
      
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
      }

      // 2. Test (if applicable)
      if (this.supportsTest) {
        this.logger.log(`Testing ${this.settingsType} settings...`);
        const testResult = await this.test(settings);
        
        if (!testResult.success) {
          throw new Error(`Test failed: ${testResult.error}`);
        }
      }

      // 3. Save to database (implemented by child class)
      this.logger.log(`Saving ${this.settingsType} settings...`);
      const saved = await this.saveToDatabase(settings);

      // 4. Invalidate cache
      await this.invalidateCache(tenantId);

      // 5. Apply to system
      this.logger.log(`Applying ${this.settingsType} settings to system...`);
      await this.apply(saved);

      // 6. Broadcast update via WebSocket
      if (this.websocketGateway) {
        await this.broadcastUpdate(saved, tenantId);
      }

      // 7. Audit log
      await this.auditService.log({
        userId,
        tenantId,
        settingsType: this.settingsType,
        action: oldSettings ? 'update' : 'create',
        changes: oldSettings
          ? this.auditService.calculateDiff(
              this.auditService.sanitize(oldSettings as any),
              this.auditService.sanitize(saved as any),
            )
          : this.auditService.sanitize(saved as any),
        ipAddress,
        userAgent,
        status: 'success',
      });

      this.logger.log(`${this.settingsType} settings saved successfully`);
      return saved;
    } catch (error) {
      // Log failure
      await this.auditService.log({
        userId,
        tenantId,
        settingsType: this.settingsType,
        action: oldSettings ? 'update' : 'create',
        ipAddress,
        userAgent,
        status: 'failed',
        errorMessage: error.message,
      });

      this.logger.error(`Failed to save ${this.settingsType} settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current settings (from cache or database)
   * @param tenantId Tenant ID (if applicable)
   * @returns Current settings or null
   */
  async getCurrent(tenantId?: string): Promise<T | null> {
    // Try cache first
    const cacheKey = this.getCacheKey(tenantId);
    const cached = await this.cacheService.get<T>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Fallback to database
    const settings = await this.loadFromDatabase(tenantId);
    
    if (settings) {
      // Cache for next time
      await this.cacheService.set(cacheKey, settings);
    }

    return settings;
  }

  /**
   * Save settings to database (implemented by child class)
   * @param settings Settings to save
   * @returns Saved settings
   */
  protected abstract saveToDatabase(settings: T): Promise<T>;

  /**
   * Load settings from database (implemented by child class)
   * @param tenantId Tenant ID (if applicable)
   * @returns Settings or null
   */
  protected abstract loadFromDatabase(tenantId?: string): Promise<T | null>;

  /**
   * Get cache key for settings
   * @param tenantId Tenant ID (if applicable)
   * @returns Cache key
   */
  protected abstract getCacheKey(tenantId?: string): string;

  /**
   * Invalidate cache for settings
   * @param tenantId Tenant ID (if applicable)
   */
  protected async invalidateCache(tenantId?: string): Promise<void> {
    const cacheKey = this.getCacheKey(tenantId);
    await this.cacheService.invalidate(cacheKey);
  }

  /**
   * Broadcast settings update via WebSocket
   * @param settings Updated settings
   * @param tenantId Tenant ID (if applicable)
   */
  protected async broadcastUpdate(settings: T, tenantId?: string): Promise<void> {
    if (!this.websocketGateway || !this.websocketGateway.server) return;

    const event = {
      type: 'settings:updated',
      settingsType: this.settingsType,
      data: settings,
    };

    try {
      if (tenantId) {
        // Broadcast to tenant users only
        this.websocketGateway.server.to(`tenant:${tenantId}`).emit('settings:updated', event);
      } else {
        // Broadcast to all users (platform settings)
        this.websocketGateway.server.emit('settings:updated', event);
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast settings update: ${error.message}`);
      // Don't throw - broadcast failures shouldn't break the save operation
    }
  }

  /**
   * Execute operation with rollback on failure
   * @param operation Operation to execute
   * @param rollback Rollback function
   * @returns Operation result
   */
  protected async executeWithRollback<R>(
    operation: () => Promise<R>,
    rollback: () => Promise<void>,
  ): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`Operation failed, rolling back: ${error.message}`);
      await rollback();
      throw error;
    }
  }
}
