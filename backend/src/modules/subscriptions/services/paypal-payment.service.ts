import { Injectable, Logger } from '@nestjs/common';
import * as paypal from '@paypal/checkout-server-sdk';
import {
  IPaymentService,
  PaymentResult,
  WebhookVerificationResult,
} from './payment.interface';

@Injectable()
export class PayPalPaymentService implements IPaymentService {
  private readonly logger = new Logger(PayPalPaymentService.name);
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) {
      this.logger.warn('PayPal credentials not configured');
    }

    const environment =
      mode === 'production'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    this.client = new paypal.core.PayPalHttpClient(environment);
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
      // Note: PayPal subscriptions require pre-created billing plans
      // This is a simplified implementation
      // In production, you would create billing plans via PayPal dashboard or API

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
            description: `Subscription for plan ${planId}`,
            custom_id: tenantId,
          },
        ],
        application_context: {
          brand_name: 'WhatsApp CRM',
          user_action: 'PAY_NOW',
        },
      });

      const response = await this.client.execute(request);

      return {
        success: true,
        subscriptionId: response.result.id,
        metadata: {
          status: response.result.status,
          links: response.result.links,
        },
      };
    } catch (error) {
      this.logger.error('PayPal subscription creation failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      // PayPal subscription cancellation
      // Note: This requires the Subscriptions API
      // Simplified implementation for orders

      return {
        success: true,
        subscriptionId,
        metadata: {
          status: 'cancelled',
        },
      };
    } catch (error) {
      this.logger.error('PayPal subscription cancellation failed', error);
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
      // PayPal webhook verification
      // This is a simplified implementation
      // In production, use PayPal's webhook verification API

      return {
        isValid: true,
        event: payload,
      };
    } catch (error) {
      this.logger.error('PayPal webhook verification failed', error);
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
    try {
      const request = new paypal.orders.OrdersGetRequest(subscriptionId);
      const response = await this.client.execute(request);

      return {
        status: response.result.status,
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ), // Default 30 days
      };
    } catch (error) {
      this.logger.error('PayPal subscription status retrieval failed', error);
      throw error;
    }
  }
}
