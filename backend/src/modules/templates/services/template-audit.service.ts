import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateAuditLog } from '../entities/template-audit-log.entity';

export enum TemplateAuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  DUPLICATE = 'duplicate',
  EXPORT = 'export',
  IMPORT = 'import',
  VIEW = 'view',
}

/**
 * Service for logging template modifications with user attribution
 * Requirement 17.4: Log all template modifications with user attribution
 */
@Injectable()
export class TemplateAuditService {
  private readonly logger = new Logger(TemplateAuditService.name);

  constructor(
    @InjectRepository(TemplateAuditLog)
    private auditLogRepository: Repository<TemplateAuditLog>,
  ) {}

  /**
   * Log a template action with user attribution
   */
  async logAction(data: {
    templateId: string;
    tenantId: string;
    action: TemplateAuditAction;
    userId?: string;
    changes?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<TemplateAuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        templateId: data.templateId,
        tenantId: data.tenantId,
        action: data.action,
        userId: data.userId,
        changes: data.changes,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      const savedLog = await this.auditLogRepository.save(auditLog);
      
      this.logger.log(
        `Audit log created: ${data.action} on template ${data.templateId} by user ${data.userId}`,
      );

      return savedLog;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      // Don't throw - audit logging should not block operations
      return null;
    }
  }

  /**
   * Get audit logs for a specific template
   */
  async getTemplateLogs(
    templateId: string,
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      action?: TemplateAuditAction;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    data: TemplateAuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      startDate,
      endDate,
    } = options;

    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.templateId = :templateId', { templateId })
      .andWhere('log.tenantId = :tenantId', { tenantId });

    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    if (userId) {
      query.andWhere('log.userId = :userId', { userId });
    }

    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate });
    }

    query.orderBy('log.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(
    userId: string,
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      action?: TemplateAuditAction;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    data: TemplateAuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 50,
      action,
      startDate,
      endDate,
    } = options;

    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.tenantId = :tenantId', { tenantId });

    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate });
    }

    query.orderBy('log.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get recent activity across all templates in a tenant
   */
  async getTenantActivity(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      action?: TemplateAuditAction;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    data: TemplateAuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 50,
      action,
      startDate,
      endDate,
    } = options;

    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId });

    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate });
    }

    query.orderBy('log.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
