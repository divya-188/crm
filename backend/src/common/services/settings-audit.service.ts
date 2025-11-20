import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsAuditLog } from '../entities/settings-audit-log.entity';

export interface AuditLogEntry {
  userId?: string;
  tenantId?: string;
  settingsType: string;
  category?: string;
  action: 'create' | 'update' | 'delete' | 'test' | 'plan_change' | 'cancel' | 'update_payment_method';
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed';
  errorMessage?: string;
}

@Injectable()
export class SettingsAuditService {
  private readonly logger = new Logger(SettingsAuditService.name);

  constructor(
    @InjectRepository(SettingsAuditLog)
    private auditLogRepository: Repository<SettingsAuditLog>,
  ) {}

  /**
   * Log a settings change
   * @param entry Audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: entry.userId,
        tenantId: entry.tenantId,
        settingsType: entry.settingsType,
        action: entry.action,
        changes: entry.changes,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        status: entry.status || 'success',
        errorMessage: entry.errorMessage,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: ${entry.settingsType} ${entry.action} by user ${entry.userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
      // Don't throw - audit failures shouldn't break the app
    }
  }

  /**
   * Get audit logs for a specific settings type
   * @param settingsType Settings type
   * @param limit Number of records to return
   * @returns Audit logs
   */
  async getByType(
    settingsType: string,
    limit: number = 50,
  ): Promise<SettingsAuditLog[]> {
    return this.auditLogRepository.find({
      where: { settingsType },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Get audit logs for a specific tenant
   * @param tenantId Tenant ID
   * @param limit Number of records to return
   * @returns Audit logs
   */
  async getByTenant(
    tenantId: string,
    limit: number = 50,
  ): Promise<SettingsAuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'tenant'],
    });
  }

  /**
   * Get audit logs for a specific user
   * @param userId User ID
   * @param limit Number of records to return
   * @returns Audit logs
   */
  async getByUser(
    userId: string,
    limit: number = 50,
  ): Promise<SettingsAuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Get recent audit logs
   * @param limit Number of records to return
   * @returns Recent audit logs
   */
  async getRecent(limit: number = 100): Promise<SettingsAuditLog[]> {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'tenant'],
    });
  }

  /**
   * Calculate diff between old and new values
   * @param oldValue Old value
   * @param newValue New value
   * @returns Diff object
   */
  calculateDiff(
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
  ): Record<string, any> {
    const diff: Record<string, any> = {};

    // Find changed and new fields
    for (const key in newValue) {
      if (oldValue[key] !== newValue[key]) {
        diff[key] = {
          old: oldValue[key],
          new: newValue[key],
        };
      }
    }

    // Find removed fields
    for (const key in oldValue) {
      if (!(key in newValue)) {
        diff[key] = {
          old: oldValue[key],
          new: null,
        };
      }
    }

    return diff;
  }

  /**
   * Sanitize sensitive data before logging
   * @param data Data to sanitize
   * @returns Sanitized data
   */
  sanitize(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'secret',
      'token',
      'key',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Clean up old audit logs
   * @param daysToKeep Number of days to keep logs
   * @returns Number of deleted records
   */
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old audit logs`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to cleanup audit logs: ${error.message}`);
      return 0;
    }
  }
}
