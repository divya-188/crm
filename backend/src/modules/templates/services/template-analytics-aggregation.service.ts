import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TemplateUsageAnalytics } from '../entities/template-usage-analytics.entity';
import { Template } from '../entities/template.entity';

/**
 * Template Analytics Aggregation Service
 * 
 * Handles daily aggregation of template usage metrics and analytics calculation.
 * Requirements: 13.2, 13.3, 13.5
 */
@Injectable()
export class TemplateAnalyticsAggregationService {
  private readonly logger = new Logger(TemplateAnalyticsAggregationService.name);

  constructor(
    @InjectRepository(TemplateUsageAnalytics)
    private analyticsRepository: Repository<TemplateUsageAnalytics>,
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
  ) {}

  /**
   * Daily analytics aggregation job
   * Runs every day at 2:00 AM to aggregate previous day's metrics
   * Requirement 13.2: Track delivery rate, read rate, and response rate per template
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyAggregation(): Promise<void> {
    this.logger.log('Starting daily analytics aggregation job');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      await this.aggregateTemplateMetrics(yesterday);

      this.logger.log('Daily analytics aggregation completed successfully');
    } catch (error) {
      this.logger.error('Error during daily analytics aggregation', error.stack);
      throw error;
    }
  }

  /**
   * Aggregate template metrics for a specific date
   * Requirement 13.2: Calculate delivery rate, read rate, response rate
   * Requirement 13.3: Display template performance metrics in a dashboard
   */
  async aggregateTemplateMetrics(date: Date): Promise<void> {
    this.logger.log(`Aggregating metrics for date: ${date.toISOString()}`);

    // Normalize date to start of day
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get all active templates
    const templates = await this.templateRepository.find({
      where: {
        isActive: true,
      },
    });

    this.logger.log(`Found ${templates.length} active templates to aggregate`);

    let aggregatedCount = 0;
    let skippedCount = 0;

    for (const template of templates) {
      try {
        // Check if analytics already exist for this date
        const existingAnalytics = await this.analyticsRepository.findOne({
          where: {
            templateId: template.id,
            tenantId: template.tenantId,
            date: targetDate,
          },
        });

        if (existingAnalytics) {
          this.logger.debug(
            `Analytics already exist for template ${template.id} on ${targetDate.toISOString()}, skipping`,
          );
          skippedCount++;
          continue;
        }

        // In a real implementation, you would fetch actual message data from a messages table
        // For now, we'll create a placeholder that can be updated when actual message tracking is implemented
        const metrics = await this.calculateDailyMetrics(
          template.id,
          template.tenantId,
          targetDate,
        );

        // Only create analytics record if there was activity
        if (metrics.sendCount > 0) {
          await this.createAnalyticsRecord(
            template.id,
            template.tenantId,
            targetDate,
            metrics,
          );
          aggregatedCount++;
        }
      } catch (error) {
        this.logger.error(
          `Error aggregating metrics for template ${template.id}`,
          error.stack,
        );
        // Continue with next template
      }
    }

    this.logger.log(
      `Aggregation complete: ${aggregatedCount} records created, ${skippedCount} skipped`,
    );
  }

  /**
   * Calculate daily metrics for a template
   * Requirement 13.2: Calculate delivery rate, read rate, response rate
   */
  private async calculateDailyMetrics(
    templateId: string,
    tenantId: string,
    date: Date,
  ): Promise<{
    sendCount: number;
    deliveredCount: number;
    readCount: number;
    repliedCount: number;
    failedCount: number;
    deliveryRate: number;
    readRate: number;
    responseRate: number;
  }> {
    // TODO: This should query actual message data from a messages/conversations table
    // For now, returning zero metrics as placeholder
    // When message tracking is implemented, this method should:
    // 1. Query messages sent using this template on the given date
    // 2. Count messages by status (sent, delivered, read, replied, failed)
    // 3. Calculate rates based on actual data

    /*
    Example implementation when messages table exists:
    
    const messages = await this.messagesRepository.find({
      where: {
        templateId,
        tenantId,
        sentAt: Between(
          date,
          new Date(date.getTime() + 24 * 60 * 60 * 1000)
        ),
      },
    });

    const sendCount = messages.length;
    const deliveredCount = messages.filter(m => m.status === 'delivered' || m.status === 'read').length;
    const readCount = messages.filter(m => m.status === 'read').length;
    const repliedCount = messages.filter(m => m.hasReply).length;
    const failedCount = messages.filter(m => m.status === 'failed').length;
    */

    const sendCount = 0;
    const deliveredCount = 0;
    const readCount = 0;
    const repliedCount = 0;
    const failedCount = 0;

    // Calculate rates
    const deliveryRate = sendCount > 0 ? (deliveredCount / sendCount) * 100 : 0;
    const readRate = deliveredCount > 0 ? (readCount / deliveredCount) * 100 : 0;
    const responseRate = deliveredCount > 0 ? (repliedCount / deliveredCount) * 100 : 0;

    return {
      sendCount,
      deliveredCount,
      readCount,
      repliedCount,
      failedCount,
      deliveryRate: Math.round(deliveryRate * 100) / 100, // Round to 2 decimal places
      readRate: Math.round(readRate * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
    };
  }

  /**
   * Create analytics record in database
   * Requirement 13.2: Add analytics data storage in template_usage_analytics table
   */
  private async createAnalyticsRecord(
    templateId: string,
    tenantId: string,
    date: Date,
    metrics: {
      sendCount: number;
      deliveredCount: number;
      readCount: number;
      repliedCount: number;
      failedCount: number;
      deliveryRate: number;
      readRate: number;
      responseRate: number;
    },
  ): Promise<TemplateUsageAnalytics> {
    const analytics = this.analyticsRepository.create({
      templateId,
      tenantId,
      date,
      sendCount: metrics.sendCount,
      deliveredCount: metrics.deliveredCount,
      readCount: metrics.readCount,
      repliedCount: metrics.repliedCount,
      failedCount: metrics.failedCount,
      deliveryRate: metrics.deliveryRate,
      readRate: metrics.readRate,
      responseRate: metrics.responseRate,
    });

    return await this.analyticsRepository.save(analytics);
  }

  /**
   * Update template quality metrics based on aggregated analytics
   * Requirement 13.3: Display template performance metrics in a dashboard
   */
  async updateTemplateQualityMetrics(templateId: string): Promise<void> {
    this.logger.log(`Updating quality metrics for template ${templateId}`);

    // Get last 30 days of analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await this.analyticsRepository.find({
      where: {
        templateId,
        date: Between(thirtyDaysAgo, new Date()),
      },
    });

    if (analytics.length === 0) {
      this.logger.debug(`No analytics data found for template ${templateId}`);
      return;
    }

    // Calculate average rates
    const totalSent = analytics.reduce((sum, a) => sum + a.sendCount, 0);
    const totalDelivered = analytics.reduce((sum, a) => sum + a.deliveredCount, 0);
    const totalRead = analytics.reduce((sum, a) => sum + a.readCount, 0);
    const totalReplied = analytics.reduce((sum, a) => sum + a.repliedCount, 0);

    const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const avgReadRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
    const avgResponseRate = totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0;

    // Update template with calculated metrics
    await this.templateRepository.update(templateId, {
      deliveryRate: Math.round(avgDeliveryRate * 100) / 100,
      readRate: Math.round(avgReadRate * 100) / 100,
      responseRate: Math.round(avgResponseRate * 100) / 100,
    });

    this.logger.log(`Quality metrics updated for template ${templateId}`);
  }

  /**
   * Calculate trend for a specific metric
   * Requirement 13.5: Track template usage over time with trend charts
   */
  async calculateTrend(
    templateId: string,
    metric: 'deliveryRate' | 'readRate' | 'responseRate' | 'usage',
    days: number = 30,
  ): Promise<{
    trend: 'up' | 'down' | 'stable';
    percentChange: number;
    dataPoints: Array<{ date: Date; value: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.analyticsRepository.find({
      where: {
        templateId,
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });

    if (analytics.length < 2) {
      return {
        trend: 'stable',
        percentChange: 0,
        dataPoints: [],
      };
    }

    // Extract data points based on metric
    const dataPoints = analytics.map((a) => {
      let value: number;
      switch (metric) {
        case 'deliveryRate':
          value = a.deliveryRate ? parseFloat(a.deliveryRate.toString()) : 0;
          break;
        case 'readRate':
          value = a.readRate ? parseFloat(a.readRate.toString()) : 0;
          break;
        case 'responseRate':
          value = a.responseRate ? parseFloat(a.responseRate.toString()) : 0;
          break;
        case 'usage':
          value = a.sendCount;
          break;
        default:
          value = 0;
      }
      return { date: a.date, value };
    });

    // Calculate trend using first half vs second half comparison
    const midpoint = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, midpoint);
    const secondHalf = dataPoints.slice(midpoint);

    const avgFirstHalf =
      firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const avgSecondHalf =
      secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;

    const percentChange =
      avgFirstHalf > 0 ? ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100 : 0;

    // Determine trend (5% threshold)
    let trend: 'up' | 'down' | 'stable';
    if (percentChange > 5) {
      trend = 'up';
    } else if (percentChange < -5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      percentChange: Math.round(percentChange * 100) / 100,
      dataPoints,
    };
  }

  /**
   * Backfill analytics for a date range
   * Useful for initial setup or recovering from missed aggregations
   */
  async backfillAnalytics(startDate: Date, endDate: Date): Promise<void> {
    this.logger.log(
      `Backfilling analytics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    let daysProcessed = 0;

    while (currentDate <= end) {
      try {
        await this.aggregateTemplateMetrics(new Date(currentDate));
        daysProcessed++;
      } catch (error) {
        this.logger.error(
          `Error backfilling analytics for ${currentDate.toISOString()}`,
          error.stack,
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.logger.log(`Backfill complete: ${daysProcessed} days processed`);
  }

  /**
   * Clean up old analytics data
   * Removes analytics older than specified retention period
   */
  async cleanupOldAnalytics(retentionDays: number = 365): Promise<void> {
    this.logger.log(`Cleaning up analytics older than ${retentionDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.analyticsRepository.delete({
      date: LessThan(cutoffDate),
    });

    this.logger.log(`Cleaned up ${result.affected || 0} old analytics records`);
  }

  /**
   * Manually trigger aggregation for a specific date
   * Useful for testing or manual corrections
   */
  async triggerManualAggregation(date: Date): Promise<void> {
    this.logger.log(`Manually triggering aggregation for ${date.toISOString()}`);
    await this.aggregateTemplateMetrics(date);
  }

  /**
   * Get aggregation status
   * Returns information about the last aggregation run
   */
  async getAggregationStatus(): Promise<{
    lastAggregationDate: Date | null;
    totalRecords: number;
    oldestRecord: Date | null;
    newestRecord: Date | null;
  }> {
    const [newestRecord] = await this.analyticsRepository.find({
      order: { date: 'DESC' },
      take: 1,
    });

    const [oldestRecord] = await this.analyticsRepository.find({
      order: { date: 'ASC' },
      take: 1,
    });

    const totalRecords = await this.analyticsRepository.count();

    return {
      lastAggregationDate: newestRecord?.date || null,
      totalRecords,
      oldestRecord: oldestRecord?.date || null,
      newestRecord: newestRecord?.date || null,
    };
  }
}
