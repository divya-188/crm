import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';

/**
 * Service for managing quota resets during subscription lifecycle events
 * Handles quota resets on renewal, upgrades, and downgrades
 */
@Injectable()
export class QuotaResetService {
  private readonly logger = new Logger(QuotaResetService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Reset quotas for a subscription
   * This is called during:
   * - Subscription renewal
   * - Plan upgrades (immediate)
   * - Plan downgrades (at period end)
   * 
   * Note: Quotas are tracked by counting actual records in the database,
   * so this method primarily manages the quota tracking metadata
   */
  async resetQuotas(subscriptionId: string): Promise<void> {
    this.logger.log(`Resetting quotas for subscription ${subscriptionId}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    // Reset quota tracking metadata
    subscription.metadata = {
      ...subscription.metadata,
      quotaResetAt: new Date().toISOString(),
      quotaResetReason: 'renewal',
      // Clear any quota warning flags
      quotaWarningsSent: {},
    };

    await this.subscriptionRepository.save(subscription);

    this.logger.log(`Quotas reset for subscription ${subscriptionId}`);
  }

  /**
   * Reset quotas on plan change (upgrade/downgrade)
   * This ensures quota warnings are recalculated based on new plan limits
   */
  async resetQuotasOnPlanChange(
    subscriptionId: string,
    oldPlanId: string,
    newPlanId: string,
  ): Promise<void> {
    this.logger.log(
      `Resetting quotas for subscription ${subscriptionId} due to plan change from ${oldPlanId} to ${newPlanId}`,
    );

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    // Reset quota tracking metadata
    subscription.metadata = {
      ...subscription.metadata,
      quotaResetAt: new Date().toISOString(),
      quotaResetReason: 'plan_change',
      oldPlanId,
      newPlanId,
      // Clear any quota warning flags so they're recalculated with new limits
      quotaWarningsSent: {},
    };

    await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `Quotas reset for subscription ${subscriptionId} after plan change`,
    );
  }
}
