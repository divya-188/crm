import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UnifiedPaymentService } from './services/unified-payment.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    private dataSource: DataSource,
    private paymentService: UnifiedPaymentService,
  ) {}

  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { 
        tenantId,
        status: In(['active', 'trialing'])
      },
      relations: ['plan']
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  async getUsageStatistics(tenantId: string) {
    // Get current subscription to know the limits
    const subscription = await this.getCurrentSubscription(tenantId);
    const planFeatures = subscription.plan.features;

    // Count current usage across different resources
    const [
      contactsCount,
      usersCount,
      campaignsCount,
      conversationsCount,
      flowsCount,
      automationsCount,
      whatsappConnectionsCount
    ] = await Promise.all([
      this.dataSource.query('SELECT COUNT(*) as count FROM contacts WHERE "tenantId" = $1', [tenantId]),
      this.dataSource.query('SELECT COUNT(*) as count FROM users WHERE "tenantId" = $1', [tenantId]),
      this.dataSource.query('SELECT COUNT(*) as count FROM campaigns WHERE "tenantId" = $1', [tenantId]),
      this.dataSource.query('SELECT COUNT(*) as count FROM conversations WHERE "tenantId" = $1', [tenantId]),
      this.dataSource.query('SELECT COUNT(*) as count FROM flows WHERE "tenantId" = $1', [tenantId]),
      this.dataSource.query('SELECT COUNT(*) as count FROM automations WHERE "tenantId" = $1', [tenantId]),
      this.dataSource.query('SELECT COUNT(*) as count FROM whatsapp_connections WHERE "tenantId" = $1', [tenantId])
    ]);

    return {
      subscription: {
        planName: subscription.plan.name,
        status: subscription.status,
        currentPeriodEnd: subscription.endDate
      },
      usage: {
        contacts: {
          used: parseInt(contactsCount[0]?.count || '0'),
          limit: planFeatures.maxContacts || 0,
          percentage: planFeatures.maxContacts ? Math.round((parseInt(contactsCount[0]?.count || '0') / planFeatures.maxContacts) * 100) : 0
        },
        users: {
          used: parseInt(usersCount[0]?.count || '0'),
          limit: planFeatures.maxUsers || 0,
          percentage: planFeatures.maxUsers ? Math.round((parseInt(usersCount[0]?.count || '0') / planFeatures.maxUsers) * 100) : 0
        },
        campaigns: {
          used: parseInt(campaignsCount[0]?.count || '0'),
          limit: planFeatures.maxCampaigns || 0,
          percentage: planFeatures.maxCampaigns ? Math.round((parseInt(campaignsCount[0]?.count || '0') / planFeatures.maxCampaigns) * 100) : 0
        },
        conversations: {
          used: parseInt(conversationsCount[0]?.count || '0'),
          limit: planFeatures.maxConversations || 0,
          percentage: planFeatures.maxConversations ? Math.round((parseInt(conversationsCount[0]?.count || '0') / planFeatures.maxConversations) * 100) : 0
        },
        flows: {
          used: parseInt(flowsCount[0]?.count || '0'),
          limit: planFeatures.maxFlows || 0,
          percentage: planFeatures.maxFlows ? Math.round((parseInt(flowsCount[0]?.count || '0') / planFeatures.maxFlows) * 100) : 0
        },
        automations: {
          used: parseInt(automationsCount[0]?.count || '0'),
          limit: planFeatures.maxAutomations || 0,
          percentage: planFeatures.maxAutomations ? Math.round((parseInt(automationsCount[0]?.count || '0') / planFeatures.maxAutomations) * 100) : 0
        },
        whatsappConnections: {
          used: parseInt(whatsappConnectionsCount[0]?.count || '0'),
          limit: planFeatures.whatsappConnections || 0,
          percentage: planFeatures.whatsappConnections ? Math.round((parseInt(whatsappConnectionsCount[0]?.count || '0') / planFeatures.whatsappConnections) * 100) : 0
        }
      },
      features: {
        customBranding: planFeatures.customBranding || false,
        prioritySupport: planFeatures.prioritySupport || false,
        apiAccess: planFeatures.apiAccess || false
      }
    };
  }

  async createSubscriptionWithPayment(
    tenantId: string,
    customerEmail: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    // Validate plan exists and is active
    const plan = await this.planRepository.findOne({
      where: { id: createSubscriptionDto.planId },
    });

    if (!plan) {
      throw new NotFoundException(
        `Subscription plan with ID ${createSubscriptionDto.planId} not found`,
      );
    }

    if (!plan.isActive) {
      throw new BadRequestException(
        `Subscription plan ${plan.name} is not currently available`,
      );
    }

    // Check if tenant already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        tenantId,
        status: In(['active', 'trialing']),
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'Tenant already has an active subscription. Please upgrade or cancel the existing subscription first.',
      );
    }

    // Create subscription with payment gateway
    const subscription = await this.paymentService.createSubscription(
      tenantId,
      createSubscriptionDto.planId,
      createSubscriptionDto.paymentProvider,
      customerEmail,
      createSubscriptionDto.paymentMethodId,
    );

    return subscription;
  }

  async findBySessionId(sessionId: string, tenantId: string) {
    // Use query builder to search in JSONB field
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.tenantId = :tenantId', { tenantId })
      .andWhere("subscription.metadata->>'sessionId' = :sessionId", { sessionId })
      .getOne();
  }

  async getSessionStatus(sessionId: string, tenantId: string) {
    const subscription = await this.findBySessionId(sessionId, tenantId);
    
    if (!subscription) {
      return {
        found: false,
        message: 'Session not found',
      };
    }

    return {
      found: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan.name,
        sessionId: subscription.metadata?.sessionId,
      },
    };
  }
}
