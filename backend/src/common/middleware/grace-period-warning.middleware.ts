import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../../modules/subscriptions/entities/subscription.entity';

/**
 * Grace Period Warning Middleware
 * 
 * Checks if the tenant's subscription is in grace period and adds warning headers
 * to API responses. This allows the frontend to display appropriate warnings.
 */
@Injectable()
export class GracePeriodWarningMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GracePeriodWarningMiddleware.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract tenant ID from authenticated user
      const user = (req as any).user;
      
      if (!user || !user.tenantId) {
        return next();
      }

      // Find active subscription for tenant
      const subscription = await this.subscriptionRepository.findOne({
        where: {
          tenantId: user.tenantId,
          status: SubscriptionStatus.PAST_DUE,
        },
        relations: ['plan'],
      });

      // Check if subscription is in grace period
      if (subscription && subscription.gracePeriodEnd) {
        const now = new Date();
        const gracePeriodEnd = new Date(subscription.gracePeriodEnd);

        // Only add warning if grace period hasn't expired yet
        if (gracePeriodEnd > now) {
          const daysRemaining = Math.ceil(
            (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          // Add warning headers
          res.setHeader('X-Subscription-Warning', 'grace-period');
          res.setHeader('X-Grace-Period-Days-Remaining', daysRemaining.toString());
          res.setHeader('X-Grace-Period-End', gracePeriodEnd.toISOString());
          res.setHeader(
            'X-Warning-Message',
            `Your subscription payment has failed. Service will be suspended in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
          );

          this.logger.warn(
            `Tenant ${user.tenantId} is in grace period. ${daysRemaining} days remaining.`,
          );
        }
      }
    } catch (error) {
      // Don't block the request if there's an error checking grace period
      this.logger.error(
        `Error checking grace period: ${error.message}`,
        error.stack,
      );
    }

    next();
  }
}
