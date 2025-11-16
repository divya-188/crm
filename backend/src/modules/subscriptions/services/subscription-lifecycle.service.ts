import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Tenant, TenantStatus } from '../../tenants/entities/tenant.entity';
import { UnifiedPaymentService } from './unified-payment.service';
import { EmailNotificationService } from './email-notification.service';
import { PaymentProvider } from '../dto/create-subscription.dto';

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private paymentService: UnifiedPaymentService,
    private emailService: EmailNotificationService,
    private dataSource: DataSource,
  ) {}

  /**
   * Create subscription on successful payment
   */
  async createSubscriptionOnPayment(
    tenantId: string,
    planId: string,
    provider: PaymentProvider,
    providerSubscriptionId: string,
    metadata?: Record<string, any>,
  ): Promise<Subscription> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan.billingCycle);

    // Check if tenant has existing subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
    });

    if (existingSubscription) {
      // Cancel existing subscription
      existingSubscription.status = SubscriptionStatus.CANCELLED;
      existingSubscription.cancelledAt = new Date();
      await this.subscriptionRepository.save(existingSubscription);
    }

    // Create new subscription
    const subscription = this.subscriptionRepository.create({
      tenantId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      stripeSubscriptionId:
        provider === PaymentProvider.STRIPE ? providerSubscriptionId : null,
      paypalSubscriptionId:
        provider === PaymentProvider.PAYPAL ? providerSubscriptionId : null,
      razorpaySubscriptionId:
        provider === PaymentProvider.RAZORPAY ? providerSubscriptionId : null,
      metadata: metadata || {},
    });

    await this.subscriptionRepository.save(subscription);

    // Update tenant status and subscription info
    await this.updateTenantSubscription(tenantId, planId, endDate);

    this.logger.log(
      `Subscription created for tenant ${tenantId} with plan ${planId}`,
    );

    return subscription;
  }

  /**
   * Renew subscription (called by webhook or manual renewal)
   */
  async renewSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Cannot renew cancelled subscription');
    }

    // Calculate new period
    const newStartDate = subscription.endDate;
    const newEndDate = this.calculateEndDate(
      newStartDate,
      subscription.plan.billingCycle,
    );

    // Update subscription
    subscription.startDate = newStartDate;
    subscription.endDate = newEndDate;
    subscription.status = SubscriptionStatus.ACTIVE;

    await this.subscriptionRepository.save(subscription);

    // Update tenant
    await this.updateTenantSubscription(
      subscription.tenantId,
      subscription.planId,
      newEndDate,
    );

    this.logger.log(`Subscription ${subscriptionId} renewed until ${newEndDate}`);

    return subscription;
  }

  /**
   * Upgrade subscription to a higher plan
   * Creates a prorated invoice for the difference and updates the plan immediately after payment
   */
  async upgradeSubscription(
    subscriptionId: string,
    newPlanId: string,
    provider: PaymentProvider,
    paymentMethodId?: string,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw new BadRequestException('New plan not found');
    }

    // Validate upgrade (new plan should be more expensive)
    if (Number(newPlan.price) <= Number(subscription.plan.price)) {
      throw new BadRequestException(
        'New plan must be more expensive than current plan for upgrade',
      );
    }

    // Calculate prorated amount (only the difference for remaining days)
    const proratedAmount = this.calculateProratedAmount(
      subscription,
      newPlan,
    );

    this.logger.log(
      `🔄 [UPGRADE] Subscription ${subscriptionId}: ${subscription.plan.name} ($${subscription.plan.price}) → ${newPlan.name} ($${newPlan.price})`,
    );
    this.logger.log(`💰 [UPGRADE] Prorated charge for remaining period: ${proratedAmount.toFixed(2)}`);
    this.logger.log(`💳 [UPGRADE] Payment provider: ${provider}`);
    console.log('\n' + '='.repeat(100));
    console.log('🔄 [UPGRADE-LIFECYCLE] UPGRADE INITIATED');
    console.log('='.repeat(100));
    console.log(`📋 Subscription ID: ${subscriptionId}`);
    console.log(`👤 Tenant ID: ${subscription.tenantId}`);
    console.log(`📊 Current Plan: ${subscription.plan.name} (ID: ${subscription.planId})`);
    console.log(`💵 Current Plan Price: ${subscription.plan.price}`);
    console.log(`📊 New Plan: ${newPlan.name} (ID: ${newPlanId})`);
    console.log(`💵 New Plan Price: ${newPlan.price}`);
    console.log(`💰 CALCULATED PRORATED AMOUNT: ${proratedAmount.toFixed(2)}`);
    console.log(`💳 Payment Provider: ${provider}`);
    console.log('='.repeat(100) + '\n');

    // Process prorated payment if amount > 0
    let checkoutUrl: string | undefined;
    if (proratedAmount > 0) {
      try {
        // Get tenant email for payment link
        const tenant = await this.dataSource.query(
          'SELECT email FROM users WHERE "tenantId" = $1 LIMIT 1',
          [subscription.tenantId],
        );
        const customerEmail = tenant[0]?.email || 'customer@example.com';
        
        this.logger.log(`📧 [UPGRADE] Creating prorated payment for ${customerEmail}`);

        console.log(`📧 [UPGRADE-PAYMENT] Creating payment for ${customerEmail}`);
        console.log(`💰 [UPGRADE-PAYMENT] Amount: ${proratedAmount.toFixed(2)}`);
        console.log(`📦 [UPGRADE-PAYMENT] Metadata:`, JSON.stringify({
          description: `Upgrade: ${subscription.plan.name} → ${newPlan.name} (prorated)`,
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          newPlanId: newPlanId,
          oldPlanId: subscription.planId,
          type: 'upgrade_proration',
          isProrated: true,
          proratedAmount,
        }, null, 2));
        const paymentResult = await this.paymentService.processOneTimePayment(
          subscription.tenantId,
          proratedAmount,
          provider,
          customerEmail,
          paymentMethodId,
          {
            description: `Upgrade: ${subscription.plan.name} → ${newPlan.name} (prorated)`,
            subscriptionId: subscription.id,
            tenantId: subscription.tenantId,
            newPlanId: newPlanId,
            oldPlanId: subscription.planId,
            type: 'upgrade_proration',
            // Mark this as a prorated charge to prevent duplicate invoices
            isProrated: true,
            proratedAmount,
          },
        );
        
        checkoutUrl = paymentResult.checkoutUrl;

        this.logger.log(`✅ [UPGRADE] Payment link created: ${checkoutUrl}`);
        console.log(`✅ [UPGRADE-PAYMENT] Payment link created successfully`);
        console.log(`🔗 [UPGRADE-PAYMENT] Checkout URL: ${checkoutUrl}`);
      } catch (error) {
        this.logger.error(`❌ [UPGRADE] Payment link creation failed: ${error.message}`);
        throw new BadRequestException(
          `Failed to create payment link: ${error.message}`,
        );
      }
    } else {
      this.logger.log(`⚠️ [UPGRADE] No prorated charge needed (amount: $0)`);
    }

    const previousPlanId = subscription.planId;

    // Store upgrade intent (plan will be updated after payment confirmation)
    subscription.metadata = {
      ...subscription.metadata,
      previousPlanId,
      upgradeIntent: {
        newPlanId,
        proratedAmount,
        initiatedAt: new Date().toISOString(),
        status: 'pending_payment',
        // Prevent duplicate invoice creation
        invoiceCreated: false,
      },
      checkoutUrl,
      proratedAmount,
    };

    console.log(`💾 [UPGRADE-METADATA] Saving subscription metadata:`);
    console.log(JSON.stringify(subscription.metadata, null, 2));
    await this.subscriptionRepository.save(subscription);

    this.logger.log(`✅ [UPGRADE] Upgrade initiated. Waiting for payment confirmation.`);
    console.log(`✅ [UPGRADE-COMPLETE] Upgrade initiated. Waiting for payment confirmation.`);
    console.log('='.repeat(100) + '\n');

    return subscription;
  }

  /**
   * Downgrade subscription to a lower plan
   * Schedules the downgrade for the end of the current billing period
   * No immediate charge - customer keeps current plan until period ends
   */
  async downgradeSubscription(
    subscriptionId: string,
    newPlanId: string,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw new BadRequestException('New plan not found');
    }

    // Validate downgrade (new plan should be less expensive)
    if (Number(newPlan.price) >= Number(subscription.plan.price)) {
      throw new BadRequestException(
        'New plan must be less expensive than current plan for downgrade',
      );
    }

    // Validate current usage against new plan limits
    await this.validateUsageAgainstPlanLimits(
      subscription.tenantId,
      newPlan,
    );

    this.logger.log(
      `🔽 [DOWNGRADE] Subscription ${subscriptionId}: ${subscription.plan.name} ($${subscription.plan.price}) → ${newPlan.name} ($${newPlan.price})`,
    );
    this.logger.log(`📅 [DOWNGRADE] Scheduled for: ${subscription.endDate.toISOString()}`);

    // Schedule downgrade at end of current period (no immediate charge)
    subscription.metadata = {
      ...subscription.metadata,
      scheduledDowngradePlanId: newPlanId,
      scheduledDowngradeAt: subscription.endDate.toISOString(),
      // Prevent duplicate invoice creation when downgrade executes
      downgradeInvoiceCreated: false,
    };

    await this.subscriptionRepository.save(subscription);

    // Send downgrade confirmation email
    try {
      await this.emailService.sendDowngradeConfirmation(
        subscription,
        newPlan,
        subscription.endDate,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send downgrade confirmation email: ${error.message}`,
      );
      // Don't fail the downgrade if email fails
    }

    this.logger.log(`✅ [DOWNGRADE] Downgrade scheduled successfully`);

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    tenantId: string,
    cancellationReason?: string,
    cancelImmediately: boolean = false,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // Verify user has permission to cancel (subscription belongs to their tenant)
    if (subscription.tenantId !== tenantId) {
      throw new BadRequestException(
        'You do not have permission to cancel this subscription',
      );
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    // Store cancellation details
    subscription.cancellationReason = cancellationReason || 'No reason provided';
    subscription.metadata = {
      ...subscription.metadata,
      cancelRequestedAt: new Date().toISOString(),
      cancelImmediately,
    };

    // Try to determine payment provider and cancel with gateway
    let provider: PaymentProvider | null = null;
    let providerSubscriptionId: string | null = null;

    try {
      provider = this.determineProvider(subscription);
      providerSubscriptionId = this.getProviderSubscriptionId(
        subscription,
        provider,
      );
    } catch (error) {
      this.logger.warn(
        `No payment provider found for subscription ${subscriptionId}. Proceeding with local cancellation only.`,
      );
    }

    if (cancelImmediately) {
      // Cancel with payment gateway if provider subscription exists
      if (provider && providerSubscriptionId) {
        try {
          await this.paymentService.cancelSubscription(
            subscriptionId,
            provider,
          );
          this.logger.log(
            `Payment gateway subscription cancelled for ${provider}: ${providerSubscriptionId}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to cancel payment gateway subscription: ${error.message}`,
          );
          // Continue with local cancellation even if gateway cancellation fails
        }
      }

      // Cancel immediately
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
      
      // Update tenant status
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (tenant) {
        tenant.status = TenantStatus.SUSPENDED;
        await this.tenantRepository.save(tenant);
      }

      this.logger.log(
        `Subscription ${subscriptionId} cancelled immediately for tenant ${tenantId}`,
      );
    } else {
      // Mark for cancellation at period end
      // Payment gateway subscription will be cancelled when period ends
      subscription.metadata = {
        ...subscription.metadata,
        cancelAtPeriodEnd: true,
        cancellationEffectiveDate: subscription.endDate.toISOString(),
      };

      this.logger.log(
        `Subscription ${subscriptionId} marked for cancellation at period end (${subscription.endDate}) for tenant ${tenantId}`,
      );
    }

    await this.subscriptionRepository.save(subscription);

    // Send cancellation confirmation email
    try {
      await this.emailService.sendCancellationConfirmation(
        subscription,
        cancelImmediately,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send cancellation confirmation email: ${error.message}`,
      );
      // Don't fail the cancellation if email fails
    }

    return subscription;
  }

  /**
   * Determine payment provider from subscription
   */
  private determineProvider(subscription: Subscription): PaymentProvider {
    if (subscription.stripeSubscriptionId) return PaymentProvider.STRIPE;
    if (subscription.paypalSubscriptionId) return PaymentProvider.PAYPAL;
    if (subscription.razorpaySubscriptionId) return PaymentProvider.RAZORPAY;
    throw new BadRequestException('No payment provider found for subscription');
  }

  /**
   * Get provider subscription ID
   */
  private getProviderSubscriptionId(
    subscription: Subscription,
    provider: PaymentProvider,
  ): string | null {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return subscription.stripeSubscriptionId;
      case PaymentProvider.PAYPAL:
        return subscription.paypalSubscriptionId;
      case PaymentProvider.RAZORPAY:
        return subscription.razorpaySubscriptionId;
      default:
        return null;
    }
  }

  /**
   * Apply coupon code to subscription
   */
  async applyCouponCode(
    subscriptionId: string,
    couponCode: string,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // Validate coupon code (simplified - in production, you'd have a coupons table)
    const coupon = await this.validateCouponCode(couponCode);

    if (!coupon.valid) {
      throw new BadRequestException('Invalid or expired coupon code');
    }

    // Apply discount
    subscription.metadata = {
      ...subscription.metadata,
      couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      appliedAt: new Date().toISOString(),
    };

    await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `Coupon ${couponCode} applied to subscription ${subscriptionId}`,
    );

    return subscription;
  }

  /**
   * Check and handle expired subscriptions (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSubscriptions(): Promise<void> {
    this.logger.log('Checking for expired subscriptions...');

    const now = new Date();
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: ['plan'],
    });

    this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const subscription of expiredSubscriptions) {
      try {
        // Check if subscription is marked for cancellation at period end
        if (subscription.metadata?.cancelAtPeriodEnd) {
          // Try to cancel with payment gateway
          try {
            const provider = this.determineProvider(subscription);
            const providerSubscriptionId = this.getProviderSubscriptionId(
              subscription,
              provider,
            );

            if (providerSubscriptionId) {
              try {
                await this.paymentService.cancelSubscription(
                  subscription.id,
                  provider,
                );
                this.logger.log(
                  `Payment gateway subscription cancelled for ${provider}: ${providerSubscriptionId}`,
                );
              } catch (error) {
                this.logger.error(
                  `Failed to cancel payment gateway subscription: ${error.message}`,
                );
                // Continue with local cancellation even if gateway cancellation fails
              }
            }
          } catch (error) {
            this.logger.warn(
              `No payment provider found for subscription ${subscription.id}. Proceeding with local cancellation only.`,
            );
          }

          subscription.status = SubscriptionStatus.CANCELLED;
          subscription.cancelledAt = new Date();
          await this.subscriptionRepository.save(subscription);

          // Update tenant status
          const tenant = await this.tenantRepository.findOne({
            where: { id: subscription.tenantId },
          });

          if (tenant) {
            tenant.status = TenantStatus.SUSPENDED;
            await this.tenantRepository.save(tenant);
          }

          // Send cancellation confirmation email
          try {
            await this.emailService.sendCancellationConfirmation(
              subscription,
              false, // Not immediate, cancelled at period end
            );
          } catch (error) {
            this.logger.error(
              `Failed to send cancellation confirmation email: ${error.message}`,
            );
          }

          this.logger.log(
            `Subscription ${subscription.id} cancelled at period end for tenant ${subscription.tenantId}`,
          );
        }
        // Check if there's a scheduled downgrade
        else if (subscription.metadata?.scheduledDowngradePlanId) {
          await this.executeScheduledDowngrade(subscription);
        } else {
          // Mark as expired
          subscription.status = SubscriptionStatus.EXPIRED;
          await this.subscriptionRepository.save(subscription);

          // Update tenant status
          const tenant = await this.tenantRepository.findOne({
            where: { id: subscription.tenantId },
          });

          if (tenant) {
            tenant.status = TenantStatus.EXPIRED;
            await this.tenantRepository.save(tenant);
          }

          this.logger.log(
            `Subscription ${subscription.id} marked as expired for tenant ${subscription.tenantId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error handling expired subscription ${subscription.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Send payment reminders (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendPaymentReminders(): Promise<void> {
    this.logger.log('Sending payment reminders...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find subscriptions expiring in 7 days
    const subscriptionsExpiringSoon = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const subscription of subscriptionsExpiringSoon) {
      const daysUntilExpiry = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      try {
        // Send reminder 7 days before expiry
        if (daysUntilExpiry === 7) {
          await this.sendReminderEmail(subscription, 7);
          this.logger.log(
            `7-day reminder sent for subscription ${subscription.id}`,
          );
        }

        // Send reminder 1 day before expiry
        if (daysUntilExpiry === 1) {
          await this.sendReminderEmail(subscription, 1);
          this.logger.log(
            `1-day reminder sent for subscription ${subscription.id}`,
          );
        }

        // Send reminder on expiry day
        if (daysUntilExpiry === 0) {
          await this.sendReminderEmail(subscription, 0);
          this.logger.log(
            `Expiry day reminder sent for subscription ${subscription.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error sending reminder for subscription ${subscription.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Handle past due subscriptions (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePastDueSubscriptions(): Promise<void> {
    this.logger.log('Checking for past due subscriptions...');

    const pastDueSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    this.logger.log(`Found ${pastDueSubscriptions.length} past due subscriptions`);

    for (const subscription of pastDueSubscriptions) {
      try {
        const daysPastDue = Math.ceil(
          (new Date().getTime() - subscription.endDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // After 7 days past due, suspend the tenant
        if (daysPastDue >= 7) {
          const tenant = await this.tenantRepository.findOne({
            where: { id: subscription.tenantId },
          });

          if (tenant && tenant.status !== TenantStatus.SUSPENDED) {
            tenant.status = TenantStatus.SUSPENDED;
            await this.tenantRepository.save(tenant);

            this.logger.log(
              `Tenant ${subscription.tenantId} suspended due to past due subscription`,
            );
          }
        }

        // Send past due reminders
        await this.sendPastDueEmail(subscription, daysPastDue);
      } catch (error) {
        this.logger.error(
          `Error handling past due subscription ${subscription.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Validate current usage against new plan limits
   */
  private async validateUsageAgainstPlanLimits(
    tenantId: string,
    newPlan: SubscriptionPlan,
  ): Promise<void> {
    // Get current usage counts
    const [
      contactsCount,
      usersCount,
      campaignsCount,
      conversationsCount,
      flowsCount,
      automationsCount,
      whatsappConnectionsCount,
    ] = await Promise.all([
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM contacts WHERE "tenantId" = $1',
        [tenantId],
      ),
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM users WHERE "tenantId" = $1',
        [tenantId],
      ),
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM campaigns WHERE "tenantId" = $1',
        [tenantId],
      ),
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM conversations WHERE "tenantId" = $1',
        [tenantId],
      ),
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM flows WHERE "tenantId" = $1',
        [tenantId],
      ),
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM automations WHERE "tenantId" = $1',
        [tenantId],
      ),
      this.tenantRepository.manager.query(
        'SELECT COUNT(*) as count FROM whatsapp_connections WHERE "tenantId" = $1',
        [tenantId],
      ),
    ]);

    const usage = {
      contacts: parseInt(contactsCount[0]?.count || '0'),
      users: parseInt(usersCount[0]?.count || '0'),
      campaigns: parseInt(campaignsCount[0]?.count || '0'),
      conversations: parseInt(conversationsCount[0]?.count || '0'),
      flows: parseInt(flowsCount[0]?.count || '0'),
      automations: parseInt(automationsCount[0]?.count || '0'),
      whatsappConnections: parseInt(whatsappConnectionsCount[0]?.count || '0'),
    };

    const violations: string[] = [];

    // Check each resource type against new plan limits
    if (usage.contacts > newPlan.features.maxContacts) {
      violations.push(
        `Contacts: ${usage.contacts} exceeds limit of ${newPlan.features.maxContacts}`,
      );
    }
    if (usage.users > newPlan.features.maxUsers) {
      violations.push(
        `Users: ${usage.users} exceeds limit of ${newPlan.features.maxUsers}`,
      );
    }
    if (usage.campaigns > newPlan.features.maxCampaigns) {
      violations.push(
        `Campaigns: ${usage.campaigns} exceeds limit of ${newPlan.features.maxCampaigns}`,
      );
    }
    if (usage.conversations > newPlan.features.maxConversations) {
      violations.push(
        `Conversations: ${usage.conversations} exceeds limit of ${newPlan.features.maxConversations}`,
      );
    }
    if (usage.flows > newPlan.features.maxFlows) {
      violations.push(
        `Flows: ${usage.flows} exceeds limit of ${newPlan.features.maxFlows}`,
      );
    }
    if (usage.automations > newPlan.features.maxAutomations) {
      violations.push(
        `Automations: ${usage.automations} exceeds limit of ${newPlan.features.maxAutomations}`,
      );
    }
    if (usage.whatsappConnections > newPlan.features.whatsappConnections) {
      violations.push(
        `WhatsApp Connections: ${usage.whatsappConnections} exceeds limit of ${newPlan.features.whatsappConnections}`,
      );
    }

    if (violations.length > 0) {
      throw new BadRequestException(
        `Cannot downgrade: Current usage exceeds new plan limits. ${violations.join('; ')}`,
      );
    }
  }

  /**
   * Private helper methods
   */

  private calculateEndDate(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);

    switch (billingCycle.toLowerCase()) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  private calculateProratedAmount(
    subscription: Subscription,
    newPlan: SubscriptionPlan,
  ): number {
    const now = new Date();
    const totalDays = Math.ceil(
      (subscription.endDate.getTime() - subscription.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const remainingDays = Math.ceil(
      (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const currentPlanDailyRate = Number(subscription.plan.price) / totalDays;
    const newPlanDailyRate = Number(newPlan.price) / totalDays;

    const proratedAmount =
      (newPlanDailyRate - currentPlanDailyRate) * remainingDays;

    return Math.max(0, proratedAmount);
  }

  private async executeScheduledDowngrade(
    subscription: Subscription,
  ): Promise<void> {
    const newPlanId = subscription.metadata.scheduledDowngradePlanId;

    if (!newPlanId) {
      return;
    }

    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      this.logger.error(
        `Scheduled downgrade plan ${newPlanId} not found for subscription ${subscription.id}`,
      );
      return;
    }

    const oldPlanId = subscription.planId;

    this.logger.log(
      `🔽 [DOWNGRADE-EXECUTE] Executing scheduled downgrade for subscription ${subscription.id}`,
    );

    // Update subscription to new plan
    subscription.planId = newPlanId;
    subscription.metadata = {
      ...subscription.metadata,
      previousPlanId: oldPlanId,
      downgradedAt: new Date().toISOString(),
      scheduledDowngradePlanId: undefined,
      scheduledDowngradeAt: undefined,
      downgradeInvoiceCreated: false, // Prevent duplicate invoices
      // Reset quota warnings for new plan limits
      quotaWarningsSent: {},
      quotaResetAt: new Date().toISOString(),
      quotaResetReason: 'downgrade',
    };

    // Renew with new plan
    const newEndDate = this.calculateEndDate(
      subscription.endDate,
      newPlan.billingCycle,
    );
    subscription.startDate = subscription.endDate;
    subscription.endDate = newEndDate;
    subscription.status = SubscriptionStatus.ACTIVE;

    await this.subscriptionRepository.save(subscription);

    // Update tenant
    await this.updateTenantSubscription(
      subscription.tenantId,
      newPlanId,
      newEndDate,
    );

    this.logger.log(
      `✅ [DOWNGRADE-EXECUTE] Subscription ${subscription.id} downgraded to ${newPlan.name}. Quota warnings reset.`,
    );
  }

  private async updateTenantSubscription(
    tenantId: string,
    planId: string,
    endDate: Date,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      this.logger.error(`Tenant ${tenantId} not found`);
      return;
    }

    const plan = await this.planRepository.findOne({ where: { id: planId } });

    if (!plan) {
      this.logger.error(`Plan ${planId} not found`);
      return;
    }

    tenant.subscriptionPlanId = planId;
    tenant.subscriptionEndsAt = endDate;
    tenant.status = TenantStatus.ACTIVE;
    
    // Update tenant limits based on plan features
    tenant.limits = {
      maxUsers: plan.features.maxUsers,
      maxContacts: plan.features.maxContacts,
      maxMessages: plan.features.maxConversations,
      maxWhatsAppConnections: plan.features.whatsappConnections,
    };

    await this.tenantRepository.save(tenant);
  }

  private async validateCouponCode(
    code: string,
  ): Promise<{ valid: boolean; discountType?: string; discountValue?: number }> {
    // Simplified coupon validation
    // In production, you'd query a coupons table
    const validCoupons: Record<
      string,
      { discountType: string; discountValue: number }
    > = {
      WELCOME10: { discountType: 'percentage', discountValue: 10 },
      SAVE20: { discountType: 'percentage', discountValue: 20 },
      FIRST50: { discountType: 'fixed', discountValue: 50 },
    };

    const coupon = validCoupons[code.toUpperCase()];

    if (coupon) {
      return { valid: true, ...coupon };
    }

    return { valid: false };
  }

  private async sendReminderEmail(
    subscription: Subscription,
    daysUntilExpiry: number,
  ): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(
      `[EMAIL] Reminder: Subscription ${subscription.id} expires in ${daysUntilExpiry} days`,
    );

    // Store reminder in metadata
    subscription.metadata = {
      ...subscription.metadata,
      lastReminderSent: new Date().toISOString(),
      lastReminderDays: daysUntilExpiry,
    };

    await this.subscriptionRepository.save(subscription);
  }

  private async sendPastDueEmail(
    subscription: Subscription,
    daysPastDue: number,
  ): Promise<void> {
    // In production, integrate with email service
    this.logger.log(
      `[EMAIL] Past due: Subscription ${subscription.id} is ${daysPastDue} days past due`,
    );

    // Store past due notification in metadata
    subscription.metadata = {
      ...subscription.metadata,
      lastPastDueNotification: new Date().toISOString(),
      daysPastDue,
    };

    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Reactivate a suspended subscription
   * Processes payment for outstanding amount and restores subscription to active status
   */
  async reactivateSubscription(
    subscriptionId: string,
    tenantId: string,
    paymentMethodId?: string,
  ): Promise<Subscription> {
    this.logger.log(`Reactivating subscription ${subscriptionId} for tenant ${tenantId}`);

    // Find the subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // Check if subscription is suspended
    if (subscription.status !== SubscriptionStatus.SUSPENDED) {
      throw new BadRequestException(
        `Cannot reactivate subscription with status: ${subscription.status}`,
      );
    }

    // Determine payment provider
    const provider = this.determineProvider(subscription);
    if (!provider) {
      throw new BadRequestException('No payment provider found for subscription');
    }

    try {
      // Calculate outstanding amount (current period + any past due amounts)
      const outstandingAmount = subscription.plan.price;

      // Process payment for outstanding amount
      const paymentResult = await this.paymentService.processPayment(
        provider,
        {
          amount: outstandingAmount,
          currency: 'USD',
          customerId: subscription.metadata?.customerId,
          paymentMethodId: paymentMethodId || subscription.metadata?.paymentMethodId,
          description: `Reactivation payment for subscription ${subscriptionId}`,
        },
      );

      if (!paymentResult.success) {
        throw new BadRequestException(
          `Payment failed: ${paymentResult.error || 'Unknown error'}`,
        );
      }

      // Calculate new end date
      const now = new Date();
      const newEndDate = this.calculateEndDate(now, subscription.plan.billingCycle);

      // Restore subscription to active status
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.startDate = now;
      subscription.endDate = newEndDate;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = newEndDate;
      subscription.renewalAttempts = 0;
      subscription.gracePeriodEnd = null;
      subscription.autoRenew = true;

      await this.subscriptionRepository.save(subscription);

      // Update tenant status
      await this.updateTenantSubscription(tenantId, subscription.planId, newEndDate);

      // Send reactivation confirmation email
      await this.emailService.sendSubscriptionReactivated(subscription, newEndDate);

      this.logger.log(
        `Subscription ${subscriptionId} reactivated successfully until ${newEndDate.toISOString()}`,
      );

      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to reactivate subscription ${subscriptionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
