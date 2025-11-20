import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { Template, TemplateStatus, TemplateStatusType } from '../entities/template.entity';
import { TemplateStatusHistory } from '../entities/template-status-history.entity';
import { MetaApiClientService, MetaTemplateStatus } from './meta-api-client.service';
import { ConfigService } from '@nestjs/config';
import { TemplateStatusHistoryService } from './template-status-history.service';
import type { TemplatesService } from '../templates.service';

/**
 * Template Status Poller Service
 * 
 * This service handles polling Meta API for template approval status updates.
 * It uses BullMQ for reliable background job processing with a 5-minute polling interval.
 * 
 * Requirements:
 * - 8.1: Poll Meta API for template status updates every 5 minutes for PENDING templates
 * - 8.2: Support four status states and maintain status history
 * - 8.6: Allow users to manually refresh template status
 */
@Processor('template-status')
@Injectable()
export class TemplateStatusPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemplateStatusPollerService.name);
  private readonly POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_POLL_ATTEMPTS = 288; // 24 hours (288 * 5 minutes)

  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(TemplateStatusHistory)
    private statusHistoryRepository: Repository<TemplateStatusHistory>,
    @InjectQueue('template-status')
    private statusQueue: Queue,
    private metaApiClient: MetaApiClientService,
    private configService: ConfigService,
    private statusHistoryService: TemplateStatusHistoryService,
    @Inject(forwardRef(() => require('../templates.service').TemplatesService))
    private templatesService: TemplatesService,
    @Inject(forwardRef(() => require('./meta-template-api.service').MetaTemplateApiService))
    private metaTemplateApiService: any,
  ) {}

  async onModuleInit() {
    this.logger.log('Template Status Poller Service initialized');
    
    // Resume polling for any templates that are still pending
    await this.resumePendingPolls();
  }

  async onModuleDestroy() {
    this.logger.log('Template Status Poller Service shutting down');
    // Clean up is handled by Bull queue
  }

  /**
   * Resume polling for templates that are still in PENDING status
   * This is called on service initialization to handle server restarts
   */
  private async resumePendingPolls(): Promise<void> {
    try {
      const pendingTemplates = await this.templateRepository.find({
        where: { status: TemplateStatus.PENDING },
        select: ['id', 'name', 'tenantId', 'metaTemplateId', 'submittedAt'],
      });

      if (pendingTemplates.length > 0) {
        this.logger.log(`Found ${pendingTemplates.length} pending templates`);
        
        // Filter templates that have metaTemplateId
        const templatesWithMetaId = pendingTemplates.filter(t => t.metaTemplateId);
        
        if (templatesWithMetaId.length === 0) {
          this.logger.debug('No pending templates with Meta template ID found');
          return;
        }
        
        this.logger.log(`Resuming polling for ${templatesWithMetaId.length} pending templates with Meta ID`);
        
        for (const template of templatesWithMetaId) {
          try {
            // Check if polling job already exists
            const existingJob = await this.statusQueue.getJob(`poll-${template.id}`);
            
            if (!existingJob) {
              await this.startPolling(template.id, template.tenantId);
            } else {
              this.logger.debug(`Polling already active for template ${template.id}`);
            }
          } catch (error) {
            // Log error but continue with other templates
            this.logger.warn(`Failed to resume polling for template ${template.id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error resuming pending polls: ${error.message}`);
    }
  }

  /**
   * Start polling for a template's approval status
   * 
   * @param templateId - Template ID to poll
   * @param tenantId - Tenant ID for the template
   * @param accessToken - Optional access token (will use config if not provided)
   */
  async startPolling(
    templateId: string,
    tenantId: string,
    accessToken?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting status polling for template: ${templateId}`);

      // Verify template exists and is in PENDING status
      const template = await this.templateRepository.findOne({
        where: { id: templateId, tenantId },
      });

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      if (template.status !== TemplateStatus.PENDING) {
        this.logger.warn(
          `Template ${templateId} is not in PENDING status (current: ${template.status}). Skipping polling.`,
        );
        return;
      }

      if (!template.metaTemplateId) {
        throw new Error(`Template ${templateId} does not have a Meta template ID`);
      }

      // Check if polling job already exists
      const existingJob = await this.statusQueue.getJob(`poll-${templateId}`);
      if (existingJob) {
        this.logger.debug(`Polling already active for template ${templateId}`);
        return;
      }

      // Add repeatable job to queue
      await this.statusQueue.add(
        'poll-status',
        {
          templateId,
          tenantId,
          metaTemplateId: template.metaTemplateId,
          accessToken: accessToken || this.getDefaultAccessToken(),
          attemptCount: 0,
        },
        {
          jobId: `poll-${templateId}`,
          repeat: {
            every: this.POLLING_INTERVAL,
          },
          attempts: 3, // Retry failed polls up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 second delay
          },
          removeOnComplete: true,
          removeOnFail: false, // Keep failed jobs for debugging
        },
      );

      this.logger.log(
        `Status polling started for template ${templateId} (interval: ${this.POLLING_INTERVAL / 1000}s)`,
      );
    } catch (error) {
      this.logger.error(`Error starting polling for template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Stop polling for a template's approval status
   * 
   * @param templateId - Template ID to stop polling
   */
  async stopPolling(templateId: string): Promise<void> {
    try {
      this.logger.log(`Stopping status polling for template: ${templateId}`);

      // Get the repeatable job
      const job = await this.statusQueue.getJob(`poll-${templateId}`);
      
      if (job) {
        // Remove the repeatable job
        await job.remove();
        this.logger.log(`Status polling stopped for template ${templateId}`);
      } else {
        this.logger.debug(`No active polling found for template ${templateId}`);
      }

      // Also remove from repeatable jobs list
      const repeatableJobs = await this.statusQueue.getRepeatableJobs();
      const jobToRemove = repeatableJobs.find((j) => j.id === `poll-${templateId}`);
      
      if (jobToRemove) {
        await this.statusQueue.removeRepeatableByKey(jobToRemove.key);
        this.logger.debug(`Removed repeatable job key for template ${templateId}`);
      }
    } catch (error) {
      this.logger.error(`Error stopping polling for template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Process status polling job
   * This method is called by Bull queue processor every 5 minutes
   * 
   * @param job - Bull job containing template polling data
   */
  @Process('poll-status')
  async handleStatusPoll(job: Job<{
    templateId: string;
    tenantId: string;
    metaTemplateId: string;
    accessToken: string;
    attemptCount: number;
  }>): Promise<void> {
    const { templateId, tenantId, metaTemplateId, accessToken, attemptCount } = job.data;

    try {
      this.logger.debug(`Polling status for template ${templateId} (attempt ${attemptCount + 1})`);

      // Fetch current template status from database
      const template = await this.templateRepository.findOne({
        where: { id: templateId, tenantId },
      });

      if (!template) {
        this.logger.warn(`Template ${templateId} not found. Stopping polling.`);
        await this.stopPolling(templateId);
        return;
      }

      // If template is no longer pending, stop polling
      if (template.status !== TemplateStatus.PENDING) {
        this.logger.log(
          `Template ${templateId} is no longer pending (status: ${template.status}). Stopping polling.`,
        );
        await this.stopPolling(templateId);
        return;
      }

      // Check if we've exceeded max polling attempts (24 hours)
      if (attemptCount >= this.MAX_POLL_ATTEMPTS) {
        this.logger.warn(
          `Max polling attempts reached for template ${templateId}. Stopping polling.`,
        );
        await this.stopPolling(templateId);
        
        // Log a warning in status history
        await this.logStatusChange(
          templateId,
          tenantId,
          TemplateStatus.PENDING,
          TemplateStatus.PENDING,
          'Polling stopped: Maximum polling duration (24 hours) exceeded. Please check Meta Business Manager manually.',
          null,
        );
        return;
      }

      // Fetch status from Meta API using MetaTemplateApiService (which handles tenant-specific tokens from database)
      let metaStatus: any;
      try {
        // Use MetaTemplateApiService which fetches tenant-specific access token from database
        metaStatus = await this.metaTemplateApiService.getTemplateStatus(tenantId, metaTemplateId);
      } catch (error) {
        this.logger.error(`Error fetching status from Meta API for template ${templateId}:`, error);
        
        // Update attempt count and continue polling
        job.data.attemptCount = attemptCount + 1;
        throw error; // Let Bull handle retry logic
      }

      this.logger.debug(`Meta API status for template ${templateId}: ${metaStatus.status}`);

      // Check if status has changed
      if (metaStatus.status !== 'PENDING') {
        await this.updateTemplateStatus(
          template,
          metaStatus.status,
          metaStatus.rejected_reason,
          metaStatus,
        );
        
        // Stop polling since status is no longer pending
        await this.stopPolling(templateId);
      } else {
        // Status still pending, update attempt count
        job.data.attemptCount = attemptCount + 1;
        this.logger.debug(
          `Template ${templateId} still pending. Will poll again in ${this.POLLING_INTERVAL / 1000}s`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing status poll for template ${templateId}:`, error);
      throw error; // Let Bull handle retry logic
    }
  }

  /**
   * Manually refresh template status (for user-initiated refresh)
   * 
   * @param templateId - Template ID to refresh
   * @param tenantId - Tenant ID for the template
   * @param accessToken - Optional access token
   * @returns Updated template
   */
  async refreshTemplateStatus(
    templateId: string,
    tenantId: string,
    accessToken?: string,
  ): Promise<Template> {
    try {
      this.logger.log(`Manual status refresh requested for template: ${templateId}`);

      const template = await this.templateRepository.findOne({
        where: { id: templateId, tenantId },
      });

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      if (!template.metaTemplateId) {
        throw new Error(`Template ${templateId} does not have a Meta template ID`);
      }

      // Only refresh if template is in PENDING status
      if (template.status !== TemplateStatus.PENDING) {
        this.logger.warn(
          `Template ${templateId} is not in PENDING status. Current status: ${template.status}`,
        );
        return template;
      }

      // Fetch status from Meta API using MetaTemplateApiService (which handles tenant-specific tokens)
      const metaStatus = await this.metaTemplateApiService.getTemplateStatus(
        tenantId,
        template.metaTemplateId,
      );

      this.logger.log(`Manual refresh - Meta status for template ${templateId}: ${metaStatus.status}`);

      // Update template if status has changed
      if (metaStatus.status !== 'PENDING') {
        await this.updateTemplateStatus(
          template,
          metaStatus.status,
          metaStatus.rejected_reason,
          metaStatus,
        );
        
        // Stop automatic polling since status is resolved
        await this.stopPolling(templateId);
      }

      // Return updated template
      return await this.templateRepository.findOne({
        where: { id: templateId, tenantId },
      });
    } catch (error) {
      this.logger.error(`Error refreshing status for template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Update template status based on Meta API response
   * 
   * @param template - Template entity to update
   * @param metaStatus - Status from Meta API
   * @param rejectionReason - Rejection reason if rejected
   * @param metaResponse - Full Meta API response
   */
  private async updateTemplateStatus(
    template: Template,
    metaStatus: string,
    rejectionReason?: string,
    metaResponse?: any,
  ): Promise<void> {
    const oldStatus = template.status;
    let newStatus: TemplateStatusType;

    // Map Meta status to our internal status
    switch (metaStatus) {
      case 'APPROVED':
        // Use the new updateApprovalStatus method for comprehensive handling
        await this.templatesService.updateApprovalStatus(
          template.tenantId,
          template.id,
          'APPROVED',
          {
            metaResponse,
            metaTemplateId: template.metaTemplateId,
          },
        );
        this.logger.log(`Template ${template.id} approved via status poller`);
        return; // Exit early as updateApprovalStatus handles everything

      case 'REJECTED':
      case 'DISABLED':
        // Use the new updateApprovalStatus method for comprehensive handling
        await this.templatesService.updateApprovalStatus(
          template.tenantId,
          template.id,
          'REJECTED',
          {
            rejectionReason: rejectionReason || `Template ${metaStatus.toLowerCase()} by Meta`,
            metaResponse,
          },
        );
        this.logger.log(`Template ${template.id} rejected via status poller`);
        return; // Exit early as updateApprovalStatus handles everything

      default:
        this.logger.warn(`Unknown Meta status: ${metaStatus}. Keeping current status.`);
        return;
    }
  }

  /**
   * Log status change in history table
   * 
   * @param templateId - Template ID
   * @param tenantId - Tenant ID
   * @param fromStatus - Previous status
   * @param toStatus - New status
   * @param reason - Reason for change
   * @param metaResponse - Full Meta API response
   */
  private async logStatusChange(
    templateId: string,
    tenantId: string,
    fromStatus: string,
    toStatus: string,
    reason?: string,
    metaResponse?: any,
  ): Promise<void> {
    try {
      await this.statusHistoryService.logStatusChange({
        templateId,
        tenantId,
        fromStatus,
        toStatus,
        reason,
        metaResponse,
        changedByUserId: null, // System-initiated change
      });
      
      this.logger.debug(
        `Status change logged for template ${templateId}: ${fromStatus} -> ${toStatus}`,
      );
    } catch (error) {
      this.logger.error(`Error logging status change for template ${templateId}:`, error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Get default access token from configuration
   * Note: This is a fallback. The system primarily uses tenant-specific tokens from the database.
   */
  private getDefaultAccessToken(): string {
    const token = this.configService.get<string>('META_ACCESS_TOKEN');
    if (!token) {
      // Return empty string as fallback - the actual token will be fetched from database
      this.logger.debug('META_ACCESS_TOKEN not in environment - will use tenant-specific token from database');
      return '';
    }
    return token;
  }

  /**
   * Get all active polling jobs
   * Useful for monitoring and debugging
   */
  async getActivePollingJobs(): Promise<Array<{
    templateId: string;
    jobId: string;
    nextRunAt: Date;
  }>> {
    try {
      const repeatableJobs = await this.statusQueue.getRepeatableJobs();
      
      return repeatableJobs
        .filter((job) => job.id?.startsWith('poll-'))
        .map((job) => ({
          templateId: job.id.replace('poll-', ''),
          jobId: job.id,
          nextRunAt: new Date(job.next),
        }));
    } catch (error) {
      this.logger.error('Error getting active polling jobs:', error);
      return [];
    }
  }

  /**
   * Stop all polling jobs
   * Useful for maintenance or shutdown
   */
  async stopAllPolling(): Promise<void> {
    try {
      this.logger.log('Stopping all template status polling jobs');
      
      const repeatableJobs = await this.statusQueue.getRepeatableJobs();
      
      for (const job of repeatableJobs) {
        if (job.id?.startsWith('poll-')) {
          await this.statusQueue.removeRepeatableByKey(job.key);
        }
      }
      
      this.logger.log('All polling jobs stopped');
    } catch (error) {
      this.logger.error('Error stopping all polling jobs:', error);
      throw error;
    }
  }
}
