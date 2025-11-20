import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { TemplateUsageAnalytics } from '../entities/template-usage-analytics.entity';
import { Template } from '../entities/template.entity';

/**
 * Template Analytics Service
 * 
 * Handles template usage analytics, performance metrics, and reporting.
 * Requirements: 13.3, 13.4, 13.6, 13.7
 */
@Injectable()
export class TemplateAnalyticsService {
  private readonly logger = new Logger(TemplateAnalyticsService.name);

  constructor(
    @InjectRepository(TemplateUsageAnalytics)
    private analyticsRepository: Repository<TemplateUsageAnalytics>,
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
  ) {}

  /**
   * Get analytics for a specific template
   * Requirement 13.3: Display template performance metrics in a dashboard
   */
  async getTemplateAnalytics(
    tenantId: string,
    templateId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    templateId: string;
    templateName: string;
    category: string;
    language: string;
    status: string;
    dateRange: {
      start: Date;
      end: Date;
    };
    metrics: {
      totalSent: number;
      totalDelivered: number;
      totalRead: number;
      totalReplied: number;
      totalFailed: number;
      avgDeliveryRate: number;
      avgReadRate: number;
      avgResponseRate: number;
    };
    dailyMetrics: Array<{
      date: Date;
      sendCount: number;
      deliveredCount: number;
      readCount: number;
      repliedCount: number;
      failedCount: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    }>;
    trends: {
      deliveryRateTrend: 'up' | 'down' | 'stable';
      readRateTrend: 'up' | 'down' | 'stable';
      responseRateTrend: 'up' | 'down' | 'stable';
      usageTrend: 'up' | 'down' | 'stable';
    };
  }> {
    this.logger.log(`Getting analytics for template ${templateId}`);

    // Verify template exists and belongs to tenant
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Set default date range (last 30 days)
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch analytics data for the date range
    const analyticsData = await this.analyticsRepository.find({
      where: {
        templateId,
        tenantId,
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });

    // Calculate aggregate metrics
    const metrics = this.calculateAggregateMetrics(analyticsData);

    // Format daily metrics
    const dailyMetrics = analyticsData.map((record) => ({
      date: record.date,
      sendCount: record.sendCount,
      deliveredCount: record.deliveredCount,
      readCount: record.readCount,
      repliedCount: record.repliedCount,
      failedCount: record.failedCount,
      deliveryRate: record.deliveryRate ? parseFloat(record.deliveryRate.toString()) : 0,
      readRate: record.readRate ? parseFloat(record.readRate.toString()) : 0,
      responseRate: record.responseRate ? parseFloat(record.responseRate.toString()) : 0,
    }));

    // Calculate trends
    const trends = this.calculateTrends(dailyMetrics);

    return {
      templateId: template.id,
      templateName: template.name,
      category: template.category,
      language: template.language,
      status: template.status,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      metrics,
      dailyMetrics,
      trends,
    };
  }

  /**
   * Get analytics summary across all templates
   * Requirement 13.4: Identify low-performing templates based on engagement metrics
   */
  async getAnalyticsSummary(
    tenantId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      language?: string;
      status?: string;
    } = {},
  ): Promise<{
    dateRange: {
      start: Date;
      end: Date;
    };
    overallMetrics: {
      totalTemplates: number;
      activeTemplates: number;
      totalSent: number;
      avgDeliveryRate: number;
      avgReadRate: number;
      avgResponseRate: number;
    };
    topTemplates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      totalSent: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    }>;
    lowPerformingTemplates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      totalSent: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
      issues: string[];
    }>;
    categoryBreakdown: Array<{
      category: string;
      templateCount: number;
      totalSent: number;
      avgDeliveryRate: number;
      avgReadRate: number;
      avgResponseRate: number;
    }>;
  }> {
    this.logger.log(`Getting analytics summary for tenant ${tenantId}`);

    // Set default date range (last 30 days)
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build template query with filters
    const templateQuery = this.templateRepository
      .createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId });

    if (options.category) {
      templateQuery.andWhere('template.category = :category', { category: options.category });
    }

    if (options.language) {
      templateQuery.andWhere('template.language = :language', { language: options.language });
    }

    if (options.status) {
      templateQuery.andWhere('template.status = :status', { status: options.status });
    }

    const templates = await templateQuery.getMany();

    // Get analytics for all templates
    const analyticsQuery = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (options.category || options.language || options.status) {
      const templateIds = templates.map((t) => t.id);
      if (templateIds.length > 0) {
        analyticsQuery.andWhere('analytics.templateId IN (:...templateIds)', { templateIds });
      } else {
        // No templates match filters
        return this.getEmptySummary(startDate, endDate);
      }
    }

    const allAnalytics = await analyticsQuery.getMany();

    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(templates, allAnalytics);

    // Get top performing templates
    const topTemplates = await this.getTopTemplates(tenantId, templates, allAnalytics, 10);

    // Get low performing templates
    const lowPerformingTemplates = await this.getLowPerformingTemplates(
      tenantId,
      templates,
      allAnalytics,
      10,
    );

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(templates, allAnalytics);

    return {
      dateRange: {
        start: startDate,
        end: endDate,
      },
      overallMetrics,
      topTemplates,
      lowPerformingTemplates,
      categoryBreakdown,
    };
  }

  /**
   * Export analytics data
   * Requirement 13.6: Allow filtering analytics by date range and template category
   */
  async exportAnalytics(
    tenantId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      templateIds?: string[];
      category?: string;
      language?: string;
      format?: 'json' | 'csv';
    } = {},
  ): Promise<any> {
    this.logger.log(`Exporting analytics for tenant ${tenantId}`);

    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build query
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .leftJoinAndSelect('analytics.template', 'template')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (options.templateIds && options.templateIds.length > 0) {
      query.andWhere('analytics.templateId IN (:...templateIds)', {
        templateIds: options.templateIds,
      });
    }

    if (options.category) {
      query.andWhere('template.category = :category', { category: options.category });
    }

    if (options.language) {
      query.andWhere('template.language = :language', { language: options.language });
    }

    query.orderBy('analytics.date', 'DESC').addOrderBy('template.name', 'ASC');

    const analyticsData = await query.getMany();

    // Format data based on export format
    const format = options.format || 'json';

    if (format === 'csv') {
      return this.formatAsCSV(analyticsData);
    }

    return this.formatAsJSON(analyticsData);
  }

  /**
   * Get template comparison report for A/B testing
   * Requirement 13.7: Provide template comparison reports for A/B testing analysis
   */
  async compareTemplates(
    tenantId: string,
    templateIds: string[],
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    dateRange: {
      start: Date;
      end: Date;
    };
    templates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      language: string;
      metrics: {
        totalSent: number;
        deliveryRate: number;
        readRate: number;
        responseRate: number;
      };
      performance: 'best' | 'good' | 'average' | 'poor';
    }>;
    winner: {
      templateId: string;
      templateName: string;
      reason: string;
    } | null;
    recommendations: string[];
  }> {
    this.logger.log(`Comparing templates: ${templateIds.join(', ')}`);

    if (templateIds.length < 2) {
      throw new Error('At least 2 templates are required for comparison');
    }

    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch templates
    const templates = await this.templateRepository.find({
      where: {
        id: In(templateIds),
        tenantId,
      },
    });

    if (templates.length !== templateIds.length) {
      throw new NotFoundException('One or more templates not found');
    }

    // Fetch analytics for each template
    const comparisonData = await Promise.all(
      templates.map(async (template) => {
        const analytics = await this.analyticsRepository.find({
          where: {
            templateId: template.id,
            tenantId,
            date: Between(startDate, endDate),
          },
        });

        const metrics = this.calculateAggregateMetrics(analytics);

        return {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          language: template.language,
          metrics: {
            totalSent: metrics.totalSent,
            deliveryRate: metrics.avgDeliveryRate,
            readRate: metrics.avgReadRate,
            responseRate: metrics.avgResponseRate,
          },
          performance: this.determinePerformance(metrics),
        };
      }),
    );

    // Determine winner
    const winner = this.determineWinner(comparisonData);

    // Generate recommendations
    const recommendations = this.generateComparisonRecommendations(comparisonData);

    return {
      dateRange: {
        start: startDate,
        end: endDate,
      },
      templates: comparisonData,
      winner,
      recommendations,
    };
  }

  // Helper methods

  private calculateAggregateMetrics(analyticsData: TemplateUsageAnalytics[]): {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalReplied: number;
    totalFailed: number;
    avgDeliveryRate: number;
    avgReadRate: number;
    avgResponseRate: number;
  } {
    if (analyticsData.length === 0) {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalReplied: 0,
        totalFailed: 0,
        avgDeliveryRate: 0,
        avgReadRate: 0,
        avgResponseRate: 0,
      };
    }

    const totals = analyticsData.reduce(
      (acc, record) => ({
        sent: acc.sent + record.sendCount,
        delivered: acc.delivered + record.deliveredCount,
        read: acc.read + record.readCount,
        replied: acc.replied + record.repliedCount,
        failed: acc.failed + record.failedCount,
      }),
      { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 },
    );

    return {
      totalSent: totals.sent,
      totalDelivered: totals.delivered,
      totalRead: totals.read,
      totalReplied: totals.replied,
      totalFailed: totals.failed,
      avgDeliveryRate: totals.sent > 0 ? (totals.delivered / totals.sent) * 100 : 0,
      avgReadRate: totals.delivered > 0 ? (totals.read / totals.delivered) * 100 : 0,
      avgResponseRate: totals.delivered > 0 ? (totals.replied / totals.delivered) * 100 : 0,
    };
  }

  private calculateTrends(
    dailyMetrics: Array<{
      date: Date;
      sendCount: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    }>,
  ): {
    deliveryRateTrend: 'up' | 'down' | 'stable';
    readRateTrend: 'up' | 'down' | 'stable';
    responseRateTrend: 'up' | 'down' | 'stable';
    usageTrend: 'up' | 'down' | 'stable';
  } {
    if (dailyMetrics.length < 2) {
      return {
        deliveryRateTrend: 'stable',
        readRateTrend: 'stable',
        responseRateTrend: 'stable',
        usageTrend: 'stable',
      };
    }

    const midpoint = Math.floor(dailyMetrics.length / 2);
    const firstHalf = dailyMetrics.slice(0, midpoint);
    const secondHalf = dailyMetrics.slice(midpoint);

    const avgFirstHalf = {
      deliveryRate: this.average(firstHalf.map((m) => m.deliveryRate)),
      readRate: this.average(firstHalf.map((m) => m.readRate)),
      responseRate: this.average(firstHalf.map((m) => m.responseRate)),
      usage: this.average(firstHalf.map((m) => m.sendCount)),
    };

    const avgSecondHalf = {
      deliveryRate: this.average(secondHalf.map((m) => m.deliveryRate)),
      readRate: this.average(secondHalf.map((m) => m.readRate)),
      responseRate: this.average(secondHalf.map((m) => m.responseRate)),
      usage: this.average(secondHalf.map((m) => m.sendCount)),
    };

    return {
      deliveryRateTrend: this.determineTrend(avgFirstHalf.deliveryRate, avgSecondHalf.deliveryRate),
      readRateTrend: this.determineTrend(avgFirstHalf.readRate, avgSecondHalf.readRate),
      responseRateTrend: this.determineTrend(avgFirstHalf.responseRate, avgSecondHalf.responseRate),
      usageTrend: this.determineTrend(avgFirstHalf.usage, avgSecondHalf.usage),
    };
  }

  private determineTrend(firstValue: number, secondValue: number): 'up' | 'down' | 'stable' {
    const threshold = 5; // 5% change threshold
    const percentChange = ((secondValue - firstValue) / (firstValue || 1)) * 100;

    if (percentChange > threshold) return 'up';
    if (percentChange < -threshold) return 'down';
    return 'stable';
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private calculateOverallMetrics(
    templates: Template[],
    allAnalytics: TemplateUsageAnalytics[],
  ): {
    totalTemplates: number;
    activeTemplates: number;
    totalSent: number;
    avgDeliveryRate: number;
    avgReadRate: number;
    avgResponseRate: number;
  } {
    const activeTemplates = templates.filter((t) => t.status === 'approved').length;
    const aggregates = this.calculateAggregateMetrics(allAnalytics);

    return {
      totalTemplates: templates.length,
      activeTemplates,
      totalSent: aggregates.totalSent,
      avgDeliveryRate: aggregates.avgDeliveryRate,
      avgReadRate: aggregates.avgReadRate,
      avgResponseRate: aggregates.avgResponseRate,
    };
  }

  private async getTopTemplates(
    tenantId: string,
    templates: Template[],
    allAnalytics: TemplateUsageAnalytics[],
    limit: number,
  ): Promise<
    Array<{
      templateId: string;
      templateName: string;
      category: string;
      totalSent: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    }>
  > {
    // Group analytics by template
    const templateMetrics = new Map<string, TemplateUsageAnalytics[]>();

    allAnalytics.forEach((analytics) => {
      if (!templateMetrics.has(analytics.templateId)) {
        templateMetrics.set(analytics.templateId, []);
      }
      templateMetrics.get(analytics.templateId)!.push(analytics);
    });

    // Calculate metrics for each template
    const templateScores = templates
      .map((template) => {
        const analytics = templateMetrics.get(template.id) || [];
        const metrics = this.calculateAggregateMetrics(analytics);

        // Calculate composite score (weighted average)
        const score =
          metrics.avgDeliveryRate * 0.3 +
          metrics.avgReadRate * 0.3 +
          metrics.avgResponseRate * 0.4;

        return {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          totalSent: metrics.totalSent,
          deliveryRate: metrics.avgDeliveryRate,
          readRate: metrics.avgReadRate,
          responseRate: metrics.avgResponseRate,
          score,
        };
      })
      .filter((t) => t.totalSent > 0) // Only include templates with usage
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return templateScores.map(({ score, ...rest }) => rest);
  }

  private async getLowPerformingTemplates(
    tenantId: string,
    templates: Template[],
    allAnalytics: TemplateUsageAnalytics[],
    limit: number,
  ): Promise<
    Array<{
      templateId: string;
      templateName: string;
      category: string;
      totalSent: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
      issues: string[];
    }>
  > {
    // Group analytics by template
    const templateMetrics = new Map<string, TemplateUsageAnalytics[]>();

    allAnalytics.forEach((analytics) => {
      if (!templateMetrics.has(analytics.templateId)) {
        templateMetrics.set(analytics.templateId, []);
      }
      templateMetrics.get(analytics.templateId)!.push(analytics);
    });

    // Define thresholds for low performance
    const LOW_DELIVERY_RATE = 85;
    const LOW_READ_RATE = 50;
    const LOW_RESPONSE_RATE = 10;
    const MIN_SENDS_FOR_ANALYSIS = 10;

    // Calculate metrics and identify issues
    const lowPerformers = templates
      .map((template) => {
        const analytics = templateMetrics.get(template.id) || [];
        const metrics = this.calculateAggregateMetrics(analytics);

        const issues: string[] = [];

        if (metrics.totalSent < MIN_SENDS_FOR_ANALYSIS) {
          return null; // Skip templates with insufficient data
        }

        if (metrics.avgDeliveryRate < LOW_DELIVERY_RATE) {
          issues.push(`Low delivery rate (${metrics.avgDeliveryRate.toFixed(1)}%)`);
        }

        if (metrics.avgReadRate < LOW_READ_RATE) {
          issues.push(`Low read rate (${metrics.avgReadRate.toFixed(1)}%)`);
        }

        if (metrics.avgResponseRate < LOW_RESPONSE_RATE) {
          issues.push(`Low response rate (${metrics.avgResponseRate.toFixed(1)}%)`);
        }

        if (issues.length === 0) {
          return null; // Not a low performer
        }

        return {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          totalSent: metrics.totalSent,
          deliveryRate: metrics.avgDeliveryRate,
          readRate: metrics.avgReadRate,
          responseRate: metrics.avgResponseRate,
          issues,
          issueCount: issues.length,
        };
      })
      .filter((t) => t !== null)
      .sort((a, b) => b!.issueCount - a!.issueCount)
      .slice(0, limit);

    return lowPerformers.map(({ issueCount, ...rest }) => rest!);
  }

  private calculateCategoryBreakdown(
    templates: Template[],
    allAnalytics: TemplateUsageAnalytics[],
  ): Array<{
    category: string;
    templateCount: number;
    totalSent: number;
    avgDeliveryRate: number;
    avgReadRate: number;
    avgResponseRate: number;
  }> {
    // Group templates by category
    const categoryGroups = new Map<string, Template[]>();
    templates.forEach((template) => {
      if (!categoryGroups.has(template.category)) {
        categoryGroups.set(template.category, []);
      }
      categoryGroups.get(template.category)!.push(template);
    });

    // Calculate metrics for each category
    return Array.from(categoryGroups.entries()).map(([category, categoryTemplates]) => {
      const templateIds = categoryTemplates.map((t) => t.id);
      const categoryAnalytics = allAnalytics.filter((a) => templateIds.includes(a.templateId));
      const metrics = this.calculateAggregateMetrics(categoryAnalytics);

      return {
        category,
        templateCount: categoryTemplates.length,
        totalSent: metrics.totalSent,
        avgDeliveryRate: metrics.avgDeliveryRate,
        avgReadRate: metrics.avgReadRate,
        avgResponseRate: metrics.avgResponseRate,
      };
    });
  }

  private getEmptySummary(startDate: Date, endDate: Date) {
    return {
      dateRange: {
        start: startDate,
        end: endDate,
      },
      overallMetrics: {
        totalTemplates: 0,
        activeTemplates: 0,
        totalSent: 0,
        avgDeliveryRate: 0,
        avgReadRate: 0,
        avgResponseRate: 0,
      },
      topTemplates: [],
      lowPerformingTemplates: [],
      categoryBreakdown: [],
    };
  }

  private formatAsJSON(analyticsData: TemplateUsageAnalytics[]): any {
    return {
      exportDate: new Date().toISOString(),
      recordCount: analyticsData.length,
      data: analyticsData.map((record) => ({
        date: record.date,
        templateId: record.templateId,
        templateName: record.template?.name,
        category: record.template?.category,
        language: record.template?.language,
        sendCount: record.sendCount,
        deliveredCount: record.deliveredCount,
        readCount: record.readCount,
        repliedCount: record.repliedCount,
        failedCount: record.failedCount,
        deliveryRate: record.deliveryRate,
        readRate: record.readRate,
        responseRate: record.responseRate,
      })),
    };
  }

  private formatAsCSV(analyticsData: TemplateUsageAnalytics[]): string {
    const headers = [
      'Date',
      'Template ID',
      'Template Name',
      'Category',
      'Language',
      'Sent',
      'Delivered',
      'Read',
      'Replied',
      'Failed',
      'Delivery Rate',
      'Read Rate',
      'Response Rate',
    ];

    const rows = analyticsData.map((record) => [
      record.date.toISOString().split('T')[0],
      record.templateId,
      record.template?.name || '',
      record.template?.category || '',
      record.template?.language || '',
      record.sendCount,
      record.deliveredCount,
      record.readCount,
      record.repliedCount,
      record.failedCount,
      record.deliveryRate || 0,
      record.readRate || 0,
      record.responseRate || 0,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csvContent;
  }

  private determinePerformance(metrics: {
    avgDeliveryRate: number;
    avgReadRate: number;
    avgResponseRate: number;
  }): 'best' | 'good' | 'average' | 'poor' {
    const score =
      metrics.avgDeliveryRate * 0.3 +
      metrics.avgReadRate * 0.3 +
      metrics.avgResponseRate * 0.4;

    if (score >= 80) return 'best';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  private determineWinner(
    comparisonData: Array<{
      templateId: string;
      templateName: string;
      metrics: {
        totalSent: number;
        deliveryRate: number;
        readRate: number;
        responseRate: number;
      };
    }>,
  ): {
    templateId: string;
    templateName: string;
    reason: string;
  } | null {
    if (comparisonData.length === 0) return null;

    // Calculate composite score for each template
    const scores = comparisonData.map((data) => ({
      ...data,
      score:
        data.metrics.deliveryRate * 0.3 +
        data.metrics.readRate * 0.3 +
        data.metrics.responseRate * 0.4,
    }));

    // Find the highest score
    const winner = scores.reduce((best, current) =>
      current.score > best.score ? current : best,
    );

    // Determine reason
    let reason = 'Best overall performance';
    if (winner.metrics.responseRate > 20) {
      reason = `Highest response rate (${winner.metrics.responseRate.toFixed(1)}%)`;
    } else if (winner.metrics.readRate > 70) {
      reason = `Highest read rate (${winner.metrics.readRate.toFixed(1)}%)`;
    } else if (winner.metrics.deliveryRate > 95) {
      reason = `Highest delivery rate (${winner.metrics.deliveryRate.toFixed(1)}%)`;
    }

    return {
      templateId: winner.templateId,
      templateName: winner.templateName,
      reason,
    };
  }

  private generateComparisonRecommendations(
    comparisonData: Array<{
      templateId: string;
      templateName: string;
      metrics: {
        totalSent: number;
        deliveryRate: number;
        readRate: number;
        responseRate: number;
      };
      performance: 'best' | 'good' | 'average' | 'poor';
    }>,
  ): string[] {
    const recommendations: string[] = [];

    // Check for low delivery rates
    const lowDelivery = comparisonData.filter((t) => t.metrics.deliveryRate < 85);
    if (lowDelivery.length > 0) {
      recommendations.push(
        `${lowDelivery.length} template(s) have low delivery rates. Check for invalid phone numbers or network issues.`,
      );
    }

    // Check for low read rates
    const lowRead = comparisonData.filter((t) => t.metrics.readRate < 50);
    if (lowRead.length > 0) {
      recommendations.push(
        `${lowRead.length} template(s) have low read rates. Consider improving message timing or preview text.`,
      );
    }

    // Check for low response rates
    const lowResponse = comparisonData.filter((t) => t.metrics.responseRate < 10);
    if (lowResponse.length > 0) {
      recommendations.push(
        `${lowResponse.length} template(s) have low response rates. Add clear call-to-action buttons or improve message content.`,
      );
    }

    // Check for insufficient data
    const lowVolume = comparisonData.filter((t) => t.metrics.totalSent < 50);
    if (lowVolume.length > 0) {
      recommendations.push(
        `${lowVolume.length} template(s) have insufficient data for reliable comparison. Send more messages for better insights.`,
      );
    }

    // General recommendation
    if (recommendations.length === 0) {
      recommendations.push('All templates are performing well. Continue monitoring for any changes.');
    }

    return recommendations;
  }
}
