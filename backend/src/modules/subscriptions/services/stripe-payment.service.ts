import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  IPaymentService,
  PaymentResult,
  WebhookVerificationResult,
} from './payment.interface';

@Injectable()
export class StripePaymentService implements IPaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      this.logger.warn('Stripe API key not configured');
      // Use a dummy key to prevent initialization errors
      this.stripe = new Stripe('sk_test_dummy', {
        apiVersion: '2025-10-29.clover',
      });
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-10-29.clover',
      });
    }
  }

  async createSubscription(
    tenantId: string,
    planId: string,
    amount: number,
    billingCycle: string,
    customerEmail: string,
    paymentMethodId?: string,
  ): Promise<PaymentResult> {
    try {
      const paymentMode = process.env.PAYMENT_MODE || 'sandbox';

      // Create or retrieve customer
      const customer = await this.getOrCreateCustomer(tenantId, customerEmail);

      // Create or retrieve price
      const price = await this.getOrCreatePrice(planId, amount, billingCycle);

      // Both sandbox and production use Checkout Session for full payment flow testing
      if (!paymentMethodId) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        const session = await this.stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card'],
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/subscription/cancel`,
          metadata: {
            tenantId,
            planId,
          },
        });

        return {
          success: true,
          subscriptionId: null, // Will be set via webhook
          customerId: customer.id,
          checkoutUrl: session.url,
          metadata: {
            sessionId: session.id,
            status: 'pending_checkout',
          },
        };
      }

      // If payment method provided, use direct subscription creation
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        metadata: {
          tenantId,
          planId,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: customer.id,
        metadata: {
          status: subscription.status,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      };
    } catch (error) {
      this.logger.error('Stripe subscription creation failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      // Use real Stripe API for both sandbox and production
      const subscription = await this.stripe.subscriptions.cancel(
        subscriptionId,
      );

      return {
        success: true,
        subscriptionId: subscription.id,
        metadata: {
          status: subscription.status,
          canceledAt: new Date(subscription.canceled_at * 1000),
        },
      };
    } catch (error) {
      this.logger.error('Stripe subscription cancellation failed', error);
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
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret,
      );

      return {
        isValid: true,
        event,
      };
    } catch (error) {
      this.logger.error('Stripe webhook verification failed', error);
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
    // Use real Stripe API for both sandbox and production
    const subscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
    );

    return {
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    };
  }

  private async getOrCreateCustomer(
    tenantId: string,
    email: string,
  ): Promise<Stripe.Customer> {
    // Search for existing customer
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return await this.stripe.customers.create({
      email,
      metadata: { tenantId },
    });
  }

  private async getOrCreatePrice(
    planId: string,
    amount: number,
    billingCycle: string,
  ): Promise<Stripe.Price> {
    // Search for existing price
    const prices = await this.stripe.prices.list({
      limit: 100,
    });

    const existingPrice = prices.data.find(
      (p) =>
        p.metadata?.planId === planId &&
        p.unit_amount === Math.round(amount * 100) &&
        p.recurring?.interval === this.mapBillingCycle(billingCycle),
    );

    if (existingPrice) {
      return existingPrice;
    }

    // Create product first
    const product = await this.stripe.products.create({
      name: `Plan ${planId}`,
      metadata: { planId },
    });

    // Create price
    return await this.stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: this.mapBillingCycle(billingCycle) as any,
      },
      metadata: { planId },
    });
  }

  /**
   * Process a one-time payment (for prorated charges, etc.)
   * Creates a Checkout Session for user to complete payment
   */
  async processOneTimePayment(
    amount: number,
    currency: string,
    paymentMethodId?: string,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; checkoutUrl?: string; transactionId?: string; error?: string }> {
    try {
      this.logger.log(`🔵 [STRIPE] Creating checkout session for one-time payment`);
      this.logger.log(`💰 [STRIPE] Amount: ${amount} ${currency}`);
      this.logger.log(`📦 [STRIPE] Metadata: ${JSON.stringify(metadata)}`);

      // Create a Checkout Session for one-time payment
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: metadata?.description || 'Plan Upgrade',
                description: `Prorated charge for plan upgrade`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/plans`,
        metadata: metadata || {},
        client_reference_id: metadata?.subscriptionId || metadata?.tenantId,
      });

      this.logger.log(`✅ [STRIPE] Checkout session created: ${session.id}`);
      this.logger.log(`🔗 [STRIPE] Checkout URL: ${session.url}`);

      return {
        success: true,
        checkoutUrl: session.url,
        transactionId: session.id,
      };
    } catch (error) {
      this.logger.error('❌ [STRIPE] One-time payment checkout creation failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private mapBillingCycle(cycle: string): string {
    const mapping = {
      monthly: 'month',
      quarterly: 'month', // Stripe doesn't have quarterly, use month with interval_count
      yearly: 'year',
      annual: 'year',
    };
    return mapping[cycle] || 'month';
  }
}
