import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlansService } from '../subscription-plans.service';
import { SubscriptionsService } from '../subscriptions.service';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entities/user.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Flow } from '../../flows/entities/flow.entity';
import { Automation } from '../../automations/entities/automation.entity';
import { WhatsAppConnection } from '../../whatsapp/entities/whatsapp-connection.entity';

/**
 * Service responsible for enforcing subscription quota limits
 * Checks current usage against plan limits before allowing resource creation
 */
@Injectable()
export class QuotaEnforcementService {
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
