import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TemplateStatusHistory } from '../entities/template-status-history.entity';
import { Template } from '../entities/template.entity';

export interface StatusChangeData {
  templateId: string;
  tenantId: string;
  fromStatus: string | null;
  toStatus: string;
  reason?: string;
  metaResponse?: any;
  changedByUserId?: string;
}

export interface StatusTimeline {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  metaResponse: any;
  changedByUserId: string | null;
  changedAt: Date;
}

@Injectable()
export class TemplateStatusHistoryService {
  private readonly logger = new Logger(TemplateStatusHistoryService.name);

  constructor(
    @InjectRepository(TemplateStatusHistory)
    private statusHistoryRepository: Repository<TemplateStatusHistory>,
  ) {}

  /**
   * Log a status change for a template
   * Requirement 8.2: Template status history tracking
   */
  async logStatusChange(data: StatusChangeData): Promise<TemplateStatusHistory> {
    this.logger.log(
      `Logging status change for template ${data.templateId}: ${data.fromStatus} -> ${data.toStatus}`,
    );

    const historyEntry = this.statusHistoryRepository.create({
      templateId: data.templateId,
      tenantId: data.tenantId,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      reason: data.reason,
      metaResponse: data.metaResponse,
      changedByUserId: data.changedByUserId,
    });

    const saved = await this.statusHistoryRepository.save(historyEntry);
    this.logger.log(`Status change logged successfully: ${saved.id}`);

    return saved;
  }

  /**
   * Get status history for a specific template
   * Requirement 8.7: Status history query methods
   */
  async getTemplateStatusHistory(
    templateId: string,
    tenantId: string,
  ): Promise<TemplateStatusHistory[]> {
    this.logger.log(`Fetching status history for template: ${templateId}`);

    const history = await this.statusHistoryRepository.find({
      where: {
        templateId,
        tenantId,
      },
      order: {
        changedAt: 'DESC',
      },
      relations: ['changedByUser'],
    });

    this.logger.log(`Found ${history.length} status history entries`);
    return history;
  }

  /**
   * Get status history for multiple templates
   */
  async getMultipleTemplatesStatusHistory(
    templateIds: string[],
    tenantId: string,
  ): Promise<Map<string, TemplateStatusHistory[]>> {
    this.logger.log(`Fetching status history for ${templateIds.length} templates`);

    const history = await this.statusHistoryRepository.find({
      where: {
        templateId: In(templateIds),
        tenantId,
      },
      order: {
        changedAt: 'DESC',
      },
      relations: ['changedByUser'],
    });

    // Group by template ID
    const historyMap = new Map<string, TemplateStatusHistory[]>();
    history.forEach((entry) => {
      if (!historyMap.has(entry.templateId)) {
        historyMap.set(entry.templateId, []);
      }
      historyMap.get(entry.templateId)!.push(entry);
    });

    return historyMap;
  }

  /**
   * Get the latest status change for a template
   */
  async getLatestStatusChange(
    templateId: string,
    tenantId: string,
  ): Promise<TemplateStatusHistory | null> {
    this.logger.log(`Fetching latest status change for template: ${templateId}`);

    const latestChange = await this.statusHistoryRepository.findOne({
      where: {
        templateId,
        tenantId,
      },
      order: {
        changedAt: 'DESC',
      },
      relations: ['changedByUser'],
    });

    return latestChange;
  }

  /**
   * Generate a status timeline for display
   * Requirement 8.7: Status timeline generation
   */
  async generateStatusTimeline(
    templateId: string,
    tenantId: string,
  ): Promise<StatusTimeline[]> {
    this.logger.log(`Generating status timeline for template: ${templateId}`);

    const history = await this.getTemplateStatusHistory(templateId, tenantId);

    const timeline: StatusTimeline[] = history.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      reason: entry.reason,
      metaResponse: entry.metaResponse,
      changedByUserId: entry.changedByUserId,
      changedAt: entry.changedAt,
    }));

    this.logger.log(`Generated timeline with ${timeline.length} entries`);
    return timeline;
  }

  /**
   * Get status changes within a date range
   */
  async getStatusChangesByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    status?: string,
  ): Promise<TemplateStatusHistory[]> {
    this.logger.log(
      `Fetching status changes for tenant ${tenantId} between ${startDate} and ${endDate}`,
    );

    const query = this.statusHistoryRepository
      .createQueryBuilder('history')
      .where('history.tenantId = :tenantId', { tenantId })
      .andWhere('history.changedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (status) {
      query.andWhere('history.toStatus = :status', { status });
    }

    query.orderBy('history.changedAt', 'DESC');

    const changes = await query.getMany();
    this.logger.log(`Found ${changes.length} status changes in date range`);

    return changes;
  }

  /**
   * Get count of status changes by status type
   */
  async getStatusChangeStats(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    this.logger.log(`Fetching status change statistics for tenant: ${tenantId}`);

    const query = this.statusHistoryRepository
      .createQueryBuilder('history')
      .select('history.toStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('history.tenantId = :tenantId', { tenantId })
      .groupBy('history.toStatus');

    if (startDate && endDate) {
      query.andWhere('history.changedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    const stats: Record<string, number> = {};
    results.forEach((result) => {
      stats[result.status] = parseInt(result.count, 10);
    });

    this.logger.log(`Status change stats: ${JSON.stringify(stats)}`);
    return stats;
  }

  /**
   * Get templates that changed to a specific status
   */
  async getTemplatesByStatusChange(
    tenantId: string,
    toStatus: string,
    limit: number = 50,
  ): Promise<TemplateStatusHistory[]> {
    this.logger.log(
      `Fetching templates that changed to status: ${toStatus} for tenant: ${tenantId}`,
    );

    const changes = await this.statusHistoryRepository.find({
      where: {
        tenantId,
        toStatus,
      },
      order: {
        changedAt: 'DESC',
      },
      take: limit,
      relations: ['template', 'changedByUser'],
    });

    this.logger.log(`Found ${changes.length} templates with status change to ${toStatus}`);
    return changes;
  }

  /**
   * Get rejection history (all rejected templates with reasons)
   */
  async getRejectionHistory(
    tenantId: string,
    limit: number = 50,
  ): Promise<TemplateStatusHistory[]> {
    this.logger.log(`Fetching rejection history for tenant: ${tenantId}`);

    const rejections = await this.statusHistoryRepository.find({
      where: {
        tenantId,
        toStatus: 'rejected',
      },
      order: {
        changedAt: 'DESC',
      },
      take: limit,
      relations: ['template', 'changedByUser'],
    });

    this.logger.log(`Found ${rejections.length} rejections`);
    return rejections;
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(
    tenantId: string,
    limit: number = 50,
  ): Promise<TemplateStatusHistory[]> {
    this.logger.log(`Fetching approval history for tenant: ${tenantId}`);

    const approvals = await this.statusHistoryRepository.find({
      where: {
        tenantId,
        toStatus: 'approved',
      },
      order: {
        changedAt: 'DESC',
      },
      take: limit,
      relations: ['template', 'changedByUser'],
    });

    this.logger.log(`Found ${approvals.length} approvals`);
    return approvals;
  }

  /**
   * Check if a template has ever been in a specific status
   */
  async hasBeenInStatus(
    templateId: string,
    tenantId: string,
    status: string,
  ): Promise<boolean> {
    const count = await this.statusHistoryRepository.count({
      where: {
        templateId,
        tenantId,
        toStatus: status,
      },
    });

    return count > 0;
  }

  /**
   * Get time spent in each status for a template
   */
  async getTimeInStatuses(
    templateId: string,
    tenantId: string,
  ): Promise<Record<string, number>> {
    this.logger.log(`Calculating time spent in each status for template: ${templateId}`);

    const history = await this.getTemplateStatusHistory(templateId, tenantId);

    if (history.length === 0) {
      return {};
    }

    const timeInStatuses: Record<string, number> = {};

    // Sort by changedAt ascending for calculation
    const sortedHistory = [...history].reverse();

    for (let i = 0; i < sortedHistory.length; i++) {
      const current = sortedHistory[i];
      const next = sortedHistory[i + 1];

      const startTime = current.changedAt.getTime();
      const endTime = next ? next.changedAt.getTime() : Date.now();
      const duration = endTime - startTime;

      if (!timeInStatuses[current.toStatus]) {
        timeInStatuses[current.toStatus] = 0;
      }

      timeInStatuses[current.toStatus] += duration;
    }

    // Convert milliseconds to hours
    Object.keys(timeInStatuses).forEach((status) => {
      timeInStatuses[status] = Math.round(timeInStatuses[status] / (1000 * 60 * 60));
    });

    this.logger.log(`Time in statuses: ${JSON.stringify(timeInStatuses)}`);
    return timeInStatuses;
  }

  /**
   * Delete status history for a template (when template is permanently deleted)
   */
  async deleteTemplateHistory(templateId: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting status history for template: ${templateId}`);

    await this.statusHistoryRepository.delete({
      templateId,
      tenantId,
    });

    this.logger.log(`Status history deleted for template: ${templateId}`);
  }

  /**
   * Get recent status changes across all templates for a tenant
   */
  async getRecentStatusChanges(
    tenantId: string,
    limit: number = 20,
  ): Promise<TemplateStatusHistory[]> {
    this.logger.log(`Fetching recent status changes for tenant: ${tenantId}`);

    const changes = await this.statusHistoryRepository.find({
      where: {
        tenantId,
      },
      order: {
        changedAt: 'DESC',
      },
      take: limit,
      relations: ['template', 'changedByUser'],
    });

    this.logger.log(`Found ${changes.length} recent status changes`);
    return changes;
  }
}
