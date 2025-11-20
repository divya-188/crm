import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Template } from '../entities/template.entity';
import { TemplateUsageAnalytics } from '../entities/template-usage-analytics.entity';

/**
 * Query optimization service for templates
 * Task 59: Optimize database queries
 * 
 * Provides optimized query methods using:
 * - Database views for complex aggregations
 * - Efficient joins and subqueries
 * - Query result caching
 * - Batch operations
 * 
 * Requirements: Performance targets
 */

export interface TemplatePerformanceSummary {
  templateId: string;
  tenantId: string;
  name: string;
  displayName: string;
  category: string;
  language: string;
  status: string;
  totalUsage: number;
  qualityScore: number;
  sendsLast30Days: number;
  deliveredLast30Days: number;
  readLast30Days: number;
  repliedLast30Days: number;
  failedLast30Days: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
  createdAt: Date;
  approvedAt: Date;
  lastUsedAt: Date;
}

export interface DailyAnalyticsSummary {
  tenantId: string;
  date: Date;
  activeTemplates: number;
  totalSends: number;
  totalDelivered: number;
  totalRead: number;
  totalReplied: number;
  totalFailed: number;
  overallDeliveryRate: number;
  overallReadRate: number;
  overallResponseRate: number;
}

export interface TopPerformingTemplate {
  templateId: string;
  tenantId: string;
  name: string;
  displayName: string;
  category: string;
  totalUsage: number;
  recentSends: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
  performanceScore: number;
}

export interface LowPerformingTemplate {
  templateId: string;
  tenantId: string;
  name: string;
  displayName: string;
  category: string;
  recentSends: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
  primaryIssue: string;
}

export interface CategoryPerformance {
  tenantId: string;
  category: string;
  templateCount: number;
  totalUsage: number;
  totalSends: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
}

export interface LanguagePerformance {
  tenantId: string;
  language: string;
  templateCount: number;
  totalUsage: number;
  totalSends: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  avgResponseRate: number;
}

@Injectable()
export class TemplateQueryOptimizerService {
  private readonly logger = new Logger(TemplateQueryOptimizerService.name);

  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    @InjectRepository(TemplateUsageAnalytics)
    private analyticsRepository: Repository<TemplateUsageAnalytics>,
    private dataSource: DataSource,
  ) {}

  /**
   * Get template performance summary using optimized view
   * Much faster than joining tables manually
   */
  async getTemplatePerformanceSummary(
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      minUsage?: number;
    } = {},
  ): Promise<TemplatePerformanceSummary[]> {
    const { limit = 50, offset = 0, minUsage = 0 } = options;

    this.logger.debug(`Getting performance summary for tenant: ${tenantId}`);

    const query = `
      SELECT * FROM template_performance_summary
      WHERE tenant_id = $1
        AND total_usage >= $2
      ORDER BY sends_last_30_days DESC
      LIMIT $3 OFFSET $4
    `;

    const results = await this.dataSource.query(query, [tenantId, minUsage, limit, offset]);

    return results.map((row) => ({
      templateId: row.template_id,
      tenantId: row.tenant_id,
      name: row.name,
      displayName: row.display_name,
      category: row.category,
      language: row.language,
      status: row.status,
      totalUsage: parseInt(row.total_usage),
      qualityScore: row.quality_score,
      sendsLast30Days: parseInt(row.sends_last_30_days),
      deliveredLast30Days: parseInt(row.delivered_last_30_days),
      readLast30Days: parseInt(row.read_last_30_days),
      repliedLast30Days: parseInt(row.replied_last_30_days),
      failedLast30Days: parseInt(row.failed_last_30_days),
      avgDeliveryRate: parseFloat(row.avg_delivery_rate) || 0,
      avgReadRate: parseFloat(row.avg_read_rate) || 0,
      avgResponseRate: parseFloat(row.avg_response_rate) || 0,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
      lastUsedAt: row.last_used_at,
    }));
  }

  /**
   * Get daily analytics summary using optimized view
   */
  async getDailyAnalyticsSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyAnalyticsSummary[]> {
    this.logger.debug(`Getting daily analytics for tenant: ${tenantId}`);

    const query = `
      SELECT * FROM daily_analytics_summary
      WHERE tenant_id = $1
        AND date BETWEEN $2 AND $3
      ORDER BY date DESC
    `;

    const results = await this.dataSource.query(query, [tenantId, startDate, endDate]);

    return results.map((row) => ({
      tenantId: row.tenant_id,
      date: row.date,
      activeTemplates: parseInt(row.active_templates),
      totalSends: parseInt(row.total_sends),
      totalDelivered: parseInt(row.total_delivered),
      totalRead: parseInt(row.total_read),
      totalReplied: parseInt(row.total_replied),
      totalFailed: parseInt(row.total_failed),
      overallDeliveryRate: parseFloat(row.overall_delivery_rate) || 0,
      overallReadRate: parseFloat(row.overall_read_rate) || 0,
      overallResponseRate: parseFloat(row.overall_response_rate) || 0,
    }));
  }

  /**
   * Get top performing templates using optimized view
   */
  async getTopPerformingTemplates(
    tenantId: string,
    limit: number = 10,
  ): Promise<TopPerformingTemplate[]> {
    this.logger.debug(`Getting top ${limit} performing templates for tenant: ${tenantId}`);

    const query = `
      SELECT * FROM top_performing_templates
      WHERE tenant_id = $1
      ORDER BY performance_score DESC
      LIMIT $2
    `;

    const results = await this.dataSource.query(query, [tenantId, limit]);

    return results.map((row) => ({
      templateId: row.template_id,
      tenantId: row.tenant_id,
      name: row.name,
      displayName: row.display_name,
      category: row.category,
      totalUsage: parseInt(row.total_usage),
      recentSends: parseInt(row.recent_sends),
      avgDeliveryRate: parseFloat(row.avg_delivery_rate) || 0,
      avgReadRate: parseFloat(row.avg_read_rate) || 0,
      avgResponseRate: parseFloat(row.avg_response_rate) || 0,
      performanceScore: parseFloat(row.performance_score) || 0,
    }));
  }

  /**
   * Get low performing templates that need attention
   */
  async getLowPerformingTemplates(
    tenantId: string,
    limit: number = 10,
  ): Promise<LowPerformingTemplate[]> {
    this.logger.debug(`Getting low performing templates for tenant: ${tenantId}`);

    const query = `
      SELECT * FROM low_performing_templates
      WHERE tenant_id = $1
      LIMIT $2
    `;

    const results = await this.dataSource.query(query, [tenantId, limit]);

    return results.map((row) => ({
      templateId: row.template_id,
      tenantId: row.tenant_id,
      name: row.name,
      displayName: row.display_name,
      category: row.category,
      recentSends: parseInt(row.recent_sends),
      avgDeliveryRate: parseFloat(row.avg_delivery_rate) || 0,
      avgReadRate: parseFloat(row.avg_read_rate) || 0,
      avgResponseRate: parseFloat(row.avg_response_rate) || 0,
      primaryIssue: row.primary_issue,
    }));
  }

  /**
   * Get category performance comparison
   */
  async getCategoryPerformance(tenantId: string): Promise<CategoryPerformance[]> {
    this.logger.debug(`Getting category performance for tenant: ${tenantId}`);

    const query = `
      SELECT * FROM category_performance
      WHERE tenant_id = $1
      ORDER BY total_usage DESC
    `;

    const results = await this.dataSource.query(query, [tenantId]);

    return results.map((row) => ({
      tenantId: row.tenant_id,
      category: row.category,
      templateCount: parseInt(row.template_count),
      totalUsage: parseInt(row.total_usage),
      totalSends: parseInt(row.total_sends),
      avgDeliveryRate: parseFloat(row.avg_delivery_rate) || 0,
      avgReadRate: parseFloat(row.avg_read_rate) || 0,
      avgResponseRate: parseFloat(row.avg_response_rate) || 0,
    }));
  }

  /**
   * Get language performance comparison
   */
  async getLanguagePerformance(tenantId: string): Promise<LanguagePerformance[]> {
    this.logger.debug(`Getting language performance for tenant: ${tenantId}`);

    const query = `
      SELECT * FROM language_performance
      WHERE tenant_id = $1
      ORDER BY total_usage DESC
    `;

    const results = await this.dataSource.query(query, [tenantId]);

    return results.map((row) => ({
      tenantId: row.tenant_id,
      language: row.language,
      templateCount: parseInt(row.template_count),
      totalUsage: parseInt(row.total_usage),
      totalSends: parseInt(row.total_sends),
      avgDeliveryRate: parseFloat(row.avg_delivery_rate) || 0,
      avgReadRate: parseFloat(row.avg_read_rate) || 0,
      avgResponseRate: parseFloat(row.avg_response_rate) || 0,
    }));
  }

  /**
   * Batch update template usage counts
   * More efficient than updating one by one
   */
  async batchUpdateUsageCounts(updates: Array<{ templateId: string; increment: number }>): Promise<void> {
    if (updates.length === 0) return;

    this.logger.debug(`Batch updating ${updates.length} template usage counts`);

    // Build a single query with CASE statement for efficient batch update
    const caseStatements = updates
      .map((u, idx) => `WHEN id = $${idx * 2 + 1} THEN "usageCount" + $${idx * 2 + 2}`)
      .join(' ');

    const ids = updates.map((u) => u.templateId);
    const increments = updates.map((u) => u.increment);
    const params = updates.flatMap((u) => [u.templateId, u.increment]);

    const query = `
      UPDATE templates
      SET 
        "usageCount" = CASE ${caseStatements} ELSE "usageCount" END,
        "lastUsedAt" = CURRENT_TIMESTAMP
      WHERE id IN (${ids.map((_, idx) => `$${idx * 2 + 1}`).join(', ')})
    `;

    await this.dataSource.query(query, params);
  }

  /**
   * Get templates with efficient eager loading
   * Reduces N+1 query problems
   */
  async getTemplatesWithRelations(
    tenantId: string,
    templateIds: string[],
  ): Promise<Template[]> {
    if (templateIds.length === 0) return [];

    this.logger.debug(`Loading ${templateIds.length} templates with relations`);

    return this.templatesRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.parentTemplate', 'parent')
      .where('template.tenantId = :tenantId', { tenantId })
      .andWhere('template.id IN (:...templateIds)', { templateIds })
      .getMany();
  }

  /**
   * Efficiently check if templates are used in active campaigns
   * Uses EXISTS subquery for better performance
   */
  async getTemplatesInActiveCampaigns(tenantId: string): Promise<string[]> {
    this.logger.debug(`Getting templates in active campaigns for tenant: ${tenantId}`);

    const query = `
      SELECT DISTINCT t.id
      FROM templates t
      WHERE t."tenantId" = $1
        AND EXISTS (
          SELECT 1 FROM campaigns c
          WHERE c."templateId" = t.id
            AND c.status IN ('draft', 'scheduled', 'running')
            AND c."tenantId" = $1
        )
    `;

    const results = await this.dataSource.query(query, [tenantId]);
    return results.map((row) => row.id);
  }

  /**
   * Get template statistics in a single optimized query
   */
  async getTemplateStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byLanguage: Record<string, number>;
  }> {
    this.logger.debug(`Getting template statistics for tenant: ${tenantId}`);

    const query = `
      SELECT 
        COUNT(*) as total,
        json_object_agg(
          COALESCE(status, 'unknown'),
          status_count
        ) FILTER (WHERE status IS NOT NULL) as by_status,
        json_object_agg(
          COALESCE(category, 'unknown'),
          category_count
        ) FILTER (WHERE category IS NOT NULL) as by_category,
        json_object_agg(
          COALESCE(language, 'unknown'),
          language_count
        ) FILTER (WHERE language IS NOT NULL) as by_language
      FROM (
        SELECT 
          status,
          category,
          language,
          COUNT(*) OVER (PARTITION BY status) as status_count,
          COUNT(*) OVER (PARTITION BY category) as category_count,
          COUNT(*) OVER (PARTITION BY language) as language_count
        FROM templates
        WHERE "tenantId" = $1 AND "isActive" = true
      ) stats
      GROUP BY status, category, language
    `;

    const result = await this.dataSource.query(query, [tenantId]);

    if (result.length === 0) {
      return {
        total: 0,
        byStatus: {},
        byCategory: {},
        byLanguage: {},
      };
    }

    return {
      total: parseInt(result[0].total) || 0,
      byStatus: result[0].by_status || {},
      byCategory: result[0].by_category || {},
      byLanguage: result[0].by_language || {},
    };
  }

  /**
   * Refresh materialized view statistics
   * Call this periodically to update view data
   */
  async refreshStatistics(): Promise<void> {
    this.logger.log('Refreshing template statistics');

    // Update table statistics for query planner
    await this.dataSource.query('ANALYZE templates');
    await this.dataSource.query('ANALYZE template_usage_analytics');
    await this.dataSource.query('ANALYZE template_status_history');
    await this.dataSource.query('ANALYZE template_test_sends');

    this.logger.log('Statistics refreshed successfully');
  }
}
