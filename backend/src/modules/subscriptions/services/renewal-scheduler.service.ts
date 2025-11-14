import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UnifiedPaymentService } from './unified-payment.service';
import { EmailNotificationService } from './email-notification.service';
import { PaymentProvider } from '../dto/create-subscription.dto';

@Injectable()
export class RenewalSchedulerService {
  private readonly logger = new Logger(RenewalSchedulerService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    private paymentService: UnifiedPaymentService,
    private emailService: EmailNotificationService,
  ) {}

  /**
   * Runs daily at 2 AM to process subscription renewals
   * Finds subscriptions expiring in the next 7 days and attempts renewal
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processRenewals() {
    this.logger.log('Starting subscription renewal processing...');

    try {
      const expiringSubscriptions = await this.findExpiringSubscriptions(7);
      
      this.logger.log(
        `Found ${expiringSubscriptions.length} subscriptions expiring in next 7 days`,
      );

      for (const subscription of expiringSubscriptions) {
        try {
          await this.attemptRenewal(subscription);
        } catch (error) {
          this.logger.error(
            `Failed to process renewal for subscription ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Subscription renewal processing completed');
    } catch (error) {
      this.logger.error(
        `Error in renewal processing: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Runs daily at 10 AM to send renewal reminder emails
   * Sends reminders at 7, 3, and 1 days before renewal
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async processRenewalReminders() {
    this.logger.log('Starting renewal reminder processing...');

    try {
      // Process reminders for each threshold
      const reminderDays = [7, 3, 1];

      for (const days of reminderDays) {
        await this.sendRemindersForDay(days);
      }

      this.logger.log('Renewal reminder processing completed');
    } catch (error) {
      this.logger.error(
        `Error in renewal reminder processing: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Runs daily at 3 AM to check for expired grace periods and suspend subscriptions
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processGracePeriodExpirations() {
    this.logger.log('Starting grace period expiration processing...');

    try {
      const now = new Date();

      // Find subscriptions with expired grace periods
      const expiredGracePeriodSubscriptions = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .leftJoinAndSelect('subscription.tenant', 'tenant')
        .where('subscription.status = :status', { status: SubscriptionStatus.PAST_DUE })
        .andWhere('subscription.gracePeriodEnd IS NOT NULL')
        .andWhere('subscription.gracePeriodEnd <= :now', { now })
        .getMany();

      this.logger.log(
        `Found ${expiredGracePeriodSubscriptions.length} subscriptions with expired grace periods`,
      );

      for (const subscription of expiredGracePeriodSubscriptions) {
        try {
          await this.suspendSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Failed to suspend subscription ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Grace period expiration processing completed');
    } catch (error) {
      this.logger.error(
        `Error in grace period expiration processing: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Suspend a subscription after grace period expiration
   */
  private async suspendSubscription(subscription: Subscription): Promise<void> {
    this.logger.warn(
      `Suspending subscription ${subscription.id} due to expired grace period`,
    );

    // Update subscription status to suspended
    subscription.status = SubscriptionStatus.SUSPENDED;
    subscription.gracePeriodEnd = null; // Clear grace period end date

    await this.subscriptionRepository.save(subscription);

    // Send suspension notification email
    await this.emailService.sendSubscriptionSuspended(subscription);

    this.logger.log(
      `Subscription ${subscription.id} has been suspended`,
    );
  }

  /**
   * Send renewal reminders for subscriptions expiring in X days
   */
  private async sendRemindersForDay(daysUntilRenewal: number): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysUntilRenewal);
    
    // Set to start of day for comparison
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find subscriptions expiring on the target date
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.tenant', 'tenant')
      .where('subscription.status = :status', { status: 'active' })
      .andWhere('subscription.autoRenew = :autoRenew', { autoRenew: true })
      .andWhere('subscription.endDate >= :targetDate', { targetDate })
      .andWhere('subscription.endDate < :nextDay', { nextDay })
      .getMany();

    this.logger.log(
      `Found ${subscriptions.length} subscriptions expiring in ${daysUntilRenewal} days`,
    );

    for (const subscription of subscriptions) {
      try {
        // Check if reminder was already sent for this day
        if (this.wasReminderSent(subscription, daysUntilRenewal)) {
          this.logger.log(
            `Reminder already sent for subscription ${subscription.id} at ${daysUntilRenewal} days`,
          );
          continue;
        }

        // Send reminder email
        await this.emailService.sendRenewalReminder(
          subscription,
          daysUntilRenewal,
        );

        // Mark reminder as sent
        await this.markReminderSent(subscription, daysUntilRenewal);

        this.logger.log(
          `Sent ${daysUntilRenewal}-day renewal reminder for subscription ${subscription.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for subscription ${subscription.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Check if a reminder was already sent for this subscription at this threshold
   */
  private wasReminderSent(
    subscription: Subscription,
    daysUntilRenewal: number,
  ): boolean {
    if (!subscription.renewalReminders) {
      return false;
    }

    return subscription.renewalReminders.includes(daysUntilRenewal);
  }

  /**
   * Mark that a reminder was sent for this subscription at this threshold
   */
  private async markReminderSent(
    subscription: Subscription,
    daysUntilRenewal: number,
  ): Promise<void> {
    if (!subscription.renewalReminders) {
      subscription.renewalReminders = [];
    }

    if (!subscription.renewalReminders.includes(daysUntilRenewal)) {
      subscription.renewalReminders.push(daysUntilRenewal);
      await this.subscriptionRepository.save(subscription);
    }
  }

  /**
   * Find subscriptions that are expiring within the specified number of days
   */
  async findExpiringSubscriptions(daysAhead: number): Promise<Subscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return this.subscriptionRepository.find({
      where: {
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]),
        endDate: LessThanOrEqual(targetDate),
        autoRenew: true,
      },
      relations: ['plan', 'tenant'],
    });
  }

  /**
   * Attempt to renew a subscription
   */
  async attemptRenewal(subscription: Subscription): Promise<void> {
    this.logger.log(`Attempting renewal for subscription ${subscription.id}`);

    // Check if subscription should be renewed
    if (!subscription.autoRenew) {
      this.logger.log(
        `Subscription ${subscription.id} has auto-renew disabled, skipping`,
      );
      return;
    }

    // Check if already renewed recently
    if (subscription.lastRenewalAttempt) {
      const hoursSinceLastAttempt =
        (Date.now() - subscription.lastRenewalAttempt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastAttempt < 23) {
        this.logger.log(
          `Subscription ${subscription.id} was attempted ${hoursSinceLastAttempt.toFixed(1)} hours ago, skipping`,
        );
        return;
      }
    }

    // Determine payment provider
    const provider = this.determineProvider(subscription);
    if (!provider) {
      this.logger.error(
        `No payment provider found for subscription ${subscription.id}`,
      );
      return;
    }

    // Get provider subscription ID
    const providerSubscriptionId = this.getProviderSubscriptionId(
      subscription,
      provider,
    );

    if (!providerSubscriptionId) {
      this.logger.error(
        `No provider subscription ID found for subscription ${subscription.id}`,
      );
      return;
    }

    // Update last renewal attempt timestamp
    subscription.lastRenewalAttempt = new Date();
    await this.subscriptionRepository.save(subscription);

    try {
      // Attempt to charge the saved payment method
      const result = await this.processRenewalPayment(
        subscription,
        provider,
        providerSubscriptionId,
      );

      if (result.success) {
        await this.handleRenewalSuccess(subscription);
      } else {
        await this.handleRenewalFailure(subscription, result.error);
      }
    } catch (error) {
      this.logger.error(
        `Error processing renewal payment for subscription ${subscription.id}: ${error.message}`,
      );
      await this.handleRenewalFailure(subscription, error.message);
    }
  }

  /**
   * Process renewal payment through the payment provider
   */
  private async processRenewalPayment(
    subscription: Subscription,
    provider: PaymentProvider,
    providerSubscriptionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // The payment provider will automatically charge the subscription
      // We just need to verify the status
      const status = await this.paymentService.syncSubscriptionStatus(
        subscription.id,
      );

      // Check if payment was successful
      if (status.status === SubscriptionStatus.ACTIVE) {
        return { success: true };
      } else if (status.status === SubscriptionStatus.PAST_DUE) {
        return { success: false, error: 'Payment failed' };
      }

      return { success: false, error: 'Unknown status' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle successful renewal
   */
  private async handleRenewalSuccess(subscription: Subscription): Promise<void> {
    this.logger.log(`Renewal successful for subscription ${subscription.id}`);

    // Extend subscription end date
    const newEndDate = this.calculateNewEndDate(
      subscription.endDate,
      subscription.plan.billingCycle,
    );

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.endDate = newEndDate;
    subscription.currentPeriodStart = subscription.endDate;
    subscription.currentPeriodEnd = newEndDate;
    subscription.renewalAttempts = 0;
    subscription.gracePeriodEnd = null;
    subscription.renewalReminders = []; // Reset reminders for next cycle

    await this.subscriptionRepository.save(subscription);

    // Send success email
    await this.emailService.sendRenewalSuccess(subscription, newEndDate);

    this.logger.log(
      `Subscription ${subscription.id} renewed until ${newEndDate.toISOString()}`,
    );
  }

  /**
   * Handle failed renewal
   */
  private async handleRenewalFailure(
    subscription: Subscription,
    error: string,
  ): Promise<void> {
    this.logger.warn(
      `Renewal failed for subscription ${subscription.id}: ${error}`,
    );

    // Increment renewal attempts
    subscription.renewalAttempts = (subscription.renewalAttempts || 0) + 1;

    // Check if max attempts reached
    if (subscription.renewalAttempts >= 3) {
      await this.handleMaxRetriesReached(subscription);
    } else {
      // Schedule retry
      subscription.status = SubscriptionStatus.PAST_DUE;
      await this.subscriptionRepository.save(subscription);

      // Send failure email with retry information
      await this.emailService.sendRenewalFailure(
        subscription,
        subscription.renewalAttempts,
        error,
      );

      this.logger.log(
        `Subscription ${subscription.id} marked as past_due, attempt ${subscription.renewalAttempts}/3`,
      );
    }
  }

  /**
   * Handle when max renewal retries are reached
   */
  private async handleMaxRetriesReached(subscription: Subscription): Promise<void> {
    this.logger.warn(
      `Max renewal attempts reached for subscription ${subscription.id}, entering grace period`,
    );

    // Enter grace period (7 days)
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    subscription.status = SubscriptionStatus.PAST_DUE;
    subscription.gracePeriodEnd = gracePeriodEnd;

    await this.subscriptionRepository.save(subscription);

    // Send past_due warning email
    await this.emailService.sendPastDueWarning(subscription, gracePeriodEnd);

    this.logger.log(
      `Subscription ${subscription.id} entered grace period until ${gracePeriodEnd.toISOString()}`,
    );
  }

  /**
   * Calculate new end date based on billing cycle
   */
  private calculateNewEndDate(currentEndDate: Date, billingCycle: string): Date {
    const newEndDate = new Date(currentEndDate);

    switch (billingCycle) {
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'quarterly':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'yearly':
      case 'annual':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
      default:
        newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    return newEndDate;
  }

  /**
   * Determine payment provider from subscription
   */
  private determineProvider(subscription: Subscription): PaymentProvider | null {
    if (subscription.stripeSubscriptionId) return PaymentProvider.STRIPE;
    if (subscription.paypalSubscriptionId) return PaymentProvider.PAYPAL;
    if (subscription.razorpaySubscriptionId) return PaymentProvider.RAZORPAY;
    return null;
  }

  /**
   * Get provider-specific subscription ID
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
}
