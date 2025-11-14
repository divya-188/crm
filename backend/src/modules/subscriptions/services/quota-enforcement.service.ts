import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlansService } from '../subscription-plans.service';
import { SubscriptionsService } from '../subscriptions.service';
import { EmailNotificationService } from './email-notification.service';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entities/user.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Flow } from '../../flows/entities/flow.entity';
import { Automation } from '../../automations/entities/automation.entity';
import { WhatsAppConnection } from '../../whatsapp/entities/whatsapp-connection.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Service responsible for enforcing subscription quota limits
 * Checks current usage against plan limits before allowing resource creation
 * Sends quota warning emails at 80%, 90%, and 95% thresholds
 */
@Injectable()
export class QuotaEnforcementService {
  // Quota warning thresholds (percentages)
  private readonly WARNING_THRESHOLDS = [80, 90, 95];
  
  // Minimum time between warnings for the same resource/threshold (24 hours)
  private readonly WARNING_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  // Map resource types to their corresponding plan limit keys
  private readonly resourceToLimitKeyMap: Record<string, string> = {
    contacts: 'maxContacts',
    users: 'maxUsers',
    conversations: 'maxConversations',
    campaigns: 'maxCampaigns',
    flows: 'maxFlows',
    automations: 'maxAutomations',
    whatsapp_connections: 'whatsappConnections',
  };

  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly emailService: EmailNotificationService,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Flow)
    private readonly flowRepository: Repository<Flow>,
    @InjectRepository(Automation)
    private readonly automationRepository: Repository<Automation>,
    @InjectRepository(WhatsAppConnection)
    private readonly whatsappConnectionRepository: Repository<WhatsAppConnection>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Main quota checking method used by QuotaGuard
   * @param tenantId - The tenant ID
   * @param resourceType - The type of resource being created
   * @throws ForbiddenException if quota is exceeded
   */
  async checkQuota(tenantId: string, resourceType: string): Promise<void> {
    // Get current subscription and plan
    let subscription;
    try {
      subscription = await this.subscriptionsService.getCurrentSubscription(tenantId);
    } catch (error) {
      throw new ForbiddenException('No active subscription found. Please subscribe to a plan.');
    }

    // Check if subscription is suspended
    if (subscription.status === 'suspended') {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Subscription suspended due to payment failure',
        details: {
          suspendedAt: subscription.updatedAt,
          reason: 'payment_failed',
          reactivateUrl: '/billing/reactivate',
        },
      });
    }

    const planId = subscription.plan.id;

    // Get current usage count for the resource type
    const currentCount = await this.getCurrentUsageCount(tenantId, resourceType);

    // Get the limit key for this resource type
    const limitKey = this.resourceToLimitKeyMap[resourceType];
    if (!limitKey) {
      // If resource type is not mapped, allow creation (no quota enforcement)
      return;
    }

    // Check quota against plan limits
    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      limitKey,
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `${this.formatResourceName(resourceType)} quota limit exceeded. Your plan allows ${quotaCheck.limit} ${this.formatResourceName(resourceType)}, you currently have ${quotaCheck.usage}.`
      );
    }

    // Check if we should send quota warning emails
    await this.checkAndSendQuotaWarnings(
      tenantId,
      resourceType,
      currentCount,
      quotaCheck.limit,
    );
  }

  /**
   * Check quota usage and send warning emails at thresholds
   * Sends warnings at 80%, 90%, and 95% usage
   */
  async checkAndSendQuotaWarnings(
    tenantId: string,
    resourceType: string,
    currentUsage: number,
    limit: number,
  ): Promise<void> {
    if (limit === 0) return; // Avoid division by zero

    const usagePercentage = Math.floor((currentUsage / limit) * 100);

    // Check each threshold
    for (const threshold of this.WARNING_THRESHOLDS) {
      if (usagePercentage >= threshold) {
        const shouldSend = await this.shouldSendWarning(
          tenantId,
          resourceType,
          threshold,
        );

        if (shouldSend) {
          await this.sendQuotaWarningEmail(
            tenantId,
            resourceType,
            threshold,
            currentUsage,
            limit,
          );
          
          await this.recordWarning(tenantId, resourceType, threshold);
        }
      }
    }
  }

  /**
   * Check if we should send a warning email
   * Returns false if a warning was sent recently for this resource/threshold
   */
  private async shouldSendWarning(
    tenantId: string,
    resourceType: string,
    threshold: number,
  ): Promise<boolean> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.quotaWarnings) {
      return true; // No warnings sent yet
    }

    const resourceWarnings = tenant.quotaWarnings[resourceType];
    if (!resourceWarnings) {
      return true; // No warnings for this resource type
    }

    const lastWarningTime = resourceWarnings[threshold.toString()];
    if (!lastWarningTime) {
      return true; // No warning sent for this threshold
    }

    // Check if enough time has passed since last warning
    const timeSinceLastWarning = Date.now() - new Date(lastWarningTime).getTime();
    return timeSinceLastWarning >= this.WARNING_COOLDOWN_MS;
  }

  /**
   * Record that a warning was sent
   */
  private async recordWarning(
    tenantId: string,
    resourceType: string,
    threshold: number,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) return;

    // Initialize quotaWarnings if not exists
    if (!tenant.quotaWarnings) {
      tenant.quotaWarnings = {};
    }

    // Initialize resource warnings if not exists
    if (!tenant.quotaWarnings[resourceType]) {
      tenant.quotaWarnings[resourceType] = {};
    }

    // Record the warning timestamp
    tenant.quotaWarnings[resourceType][threshold.toString()] = new Date();

    await this.tenantRepository.save(tenant);
  }

  /**
   * Send quota warning email
   */
  private async sendQuotaWarningEmail(
    tenantId: string,
    resourceType: string,
    percentage: number,
    currentUsage: number,
    limit: number,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['users'],
    });

    if (!tenant) return;

    // Get tenant admin email (first user or from settings)
    const adminEmail = tenant.settings?.adminEmail || 'admin@example.com';
    const tenantName = tenant.name;

    await this.emailService.sendQuotaWarning(
      adminEmail,
      tenantName,
      this.formatResourceName(resourceType),
      percentage,
      currentUsage,
      limit,
    );
  }

  /**
   * Get current usage count for a specific resource type
   */
  private async getCurrentUsageCount(tenantId: string, resourceType: string): Promise<number> {
    switch (resourceType) {
      case 'contacts':
        return await this.contactRepository.count({ where: { tenantId } });
      case 'users':
        return await this.userRepository.count({ where: { tenantId } });
      case 'conversations':
        return await this.conversationRepository.count({ where: { tenantId } });
      case 'campaigns':
        return await this.campaignRepository.count({ where: { tenantId } });
      case 'flows':
        return await this.flowRepository.count({ where: { tenantId } });
      case 'automations':
        return await this.automationRepository.count({ where: { tenantId } });
      case 'whatsapp_connections':
        return await this.whatsappConnectionRepository.count({ where: { tenantId } });
      default:
        return 0;
    }
  }

  /**
   * Format resource name for user-friendly error messages
   */
  private formatResourceName(resourceType: string): string {
    return resourceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Legacy methods for backward compatibility
  async checkContactQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.contactRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'maxContacts',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `Contact limit reached. Your plan allows ${quotaCheck.limit} contacts.`
      );
    }
  }

  async checkUserQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.userRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'maxUsers',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `User limit reached. Your plan allows ${quotaCheck.limit} users.`
      );
    }
  }

  async checkConversationQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.conversationRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'maxConversations',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `Conversation limit reached. Your plan allows ${quotaCheck.limit} conversations.`
      );
    }
  }

  async checkCampaignQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.campaignRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'maxCampaigns',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `Campaign limit reached. Your plan allows ${quotaCheck.limit} campaigns.`
      );
    }
  }

  async checkFlowQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.flowRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'maxFlows',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `Flow limit reached. Your plan allows ${quotaCheck.limit} flows.`
      );
    }
  }

  async checkAutomationQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.automationRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'maxAutomations',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `Automation limit reached. Your plan allows ${quotaCheck.limit} automations.`
      );
    }
  }

  async checkWhatsAppConnectionQuota(tenantId: string, planId: string): Promise<void> {
    const currentCount = await this.whatsappConnectionRepository.count({
      where: { tenantId },
    });

    const quotaCheck = await this.subscriptionPlansService.enforceQuota(
      planId,
      'whatsappConnections',
      currentCount,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        `WhatsApp connection limit reached. Your plan allows ${quotaCheck.limit} connections.`
      );
    }
  }

  async checkFeatureAccess(planId: string, feature: string): Promise<void> {
    const hasAccess = await this.subscriptionPlansService.checkFeature(planId, feature);

    if (!hasAccess) {
      throw new ForbiddenException(
        `This feature is not available in your current plan.`
      );
    }
  }
}
