import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IPaymentService,
  PaymentResult,
  WebhookVerificationResult,
} from './payment.interface';

const Razorpay = require('razorpay');

@Injectable()
export class RazorpayPaymentService implements IPaymentService {
  private readonly logger = new Logger(RazorpayPaymentService.name);
  private razorpay: any;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      this.logger.warn('Razorpay credentials not configured');
      // Use dummy credentials to prevent initialization errors
      this.razorpay = new Razorpay({
        key_id: 'rzp_test_dummy',
        key_secret: 'dummy_secret',
      });
    } else {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  async createSubscription(
    tenantId: string,
    planId: string,
    amount: number,
    billingCycle: string,
    customerEmail: string,
    paymentToken?: string,
  ): Promise<PaymentResult> {
    try {
      // Create or get plan
      const plan = await this.getOrCreatePlan(planId, amount, billingCycle);

      // Create customer
      const customer = await this.razorpay.customers.create({
        name: `Tenant ${tenantId}`,
        email: customerEmail,
        notes: {
          tenantId,
        },
      });

      // Create subscription
      const subscription: any = await this.razorpay.subscriptions.create({
        plan_id: plan.id,
        customer_notify: 1,
        total_count: billingCycle === 'monthly' ? 12 : 1,
        quantity: 1,
        notes: {
          tenantId,
          planId,
          customerId: customer.id,
        },
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: customer.id,
        metadata: {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_end * 1000),
        },
      };
    } catch (error) {
      this.logger.error('Razorpay subscription creation failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(
        subscriptionId,
        true, // Cancel at cycle end
      );

      return {
        success: true,
        subscriptionId: subscription.id,
        metadata: {
          status: subscription.status,
          canceledAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('Razorpay subscription cancellation failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyWebhook(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<WebhookVerificationResult> {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const isValid = expectedSignature === signature;

      return {
        isValid,
        event: isValid ? payload : undefined,
        error: isValid ? undefined : 'Invalid signature',
      };
    } catch (error) {
      this.logger.error('Razorpay webhook verification failed', error);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<{
    status: string;
    currentPeriodEnd: Date;
  }> {
    const subscription = await this.razorpay.subscriptions.fetch(
      subscriptionId,
    );

    return {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_end * 1000),
    };
  }

  private async getOrCreatePlan(
    planId: string,
    amount: number,
    billingCycle: string,
  ): Promise<any> {
    try {
      // Try to fetch existing plans
      const plans = await this.razorpay.plans.all();
      const existingPlan = plans.items.find(
        (p: any) => p.notes?.planId === planId,
      );

      if (existingPlan) {
        return existingPlan;
      }

      // Create new plan
      return await this.razorpay.plans.create({
        period: this.mapBillingCycle(billingCycle),
        interval: 1,
        item: {
          name: `Plan ${planId}`,
          amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
          currency: 'INR',
        },
        notes: {
          planId,
        },
      });
    } catch (error) {
      this.logger.error('Razorpay plan creation failed', error);
      throw error;
    }
  }

  private mapBillingCycle(cycle: string): 'monthly' | 'yearly' | 'weekly' | 'daily' {
    const mapping: Record<string, 'monthly' | 'yearly' | 'weekly' | 'daily'> = {
      monthly: 'monthly',
      quarterly: 'monthly', // Razorpay doesn't have quarterly
      yearly: 'yearly',
      annual: 'yearly',
    };
    return mapping[cycle] || 'monthly';
  }
}
