import { Injectable, Logger } from '@nestjs/common'
import { IPaymentService, PaymentResult, WebhookVerificationResult } from './payment.interface'

// https://razorpay.com/docs/api/payments/subscriptions

@Injectable()
export class RazorpayPaymentService implements IPaymentService {
  private readonly logger = new Logger(RazorpayPaymentService.name)
  private razorpay: any

  constructor() {
    const Razorpay = require('razorpay')
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      this.logger.warn('Razorpay credentials not configured')
    }

    this.razorpay = new Razorpay({ key_id, key_secret })
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
      const { period, interval, totalCount } = this.mapBillingCycle(billingCycle)
      const amountPaise = Math.round(amount * 100)

      // Get callback URLs from environment or use defaults
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      
      // Create plan
      const plan = await this.razorpay.plans.create({
        period,
        interval,
        item: {
          name: `Plan ${planId}`,
          amount: amountPaise,
          currency: 'INR',
          description: `Subscription plan ${planId}`,
        },
        notes: { tenantId, planId },
      })

      // Create subscription
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: plan.id,
        total_count: totalCount,
        customer_notify: 1,
        notes: { 
          tenantId, 
          planId, 
          customerEmail,
        },
      })

      // Create a payment link with callback URL for better UX
      // This allows automatic redirect after payment
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: amountPaise,
        currency: 'INR',
        description: `Subscription: ${planId}`,
        customer: {
          email: customerEmail,
        },
        notify: {
          sms: false,
          email: true,
        },
        reminder_enable: false,
        callback_url: `${frontendUrl}/subscription/success?provider=razorpay&subscription_id=${subscription.id}&tenant_id=${tenantId}`,
        callback_method: 'get',
        notes: {
          tenantId,
          planId,
          subscriptionId: subscription.id,
          type: 'subscription_payment',
        },
      })

      this.logger.log(`Created Razorpay subscription ${subscription.id} with payment link ${paymentLink.id}`)
      
      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: undefined,
        checkoutUrl: paymentLink.short_url, // Use payment link instead of subscription link
        metadata: {
          status: subscription.status,
          razorpaySubscriptionId: subscription.id,
          razorpayPaymentLinkId: paymentLink.id,
          callbackUrl: `${frontendUrl}/subscription/success`,
        },
      }
    } catch (error) {
      this.logger.error('Razorpay subscription creation failed', error)
      return { success: false, error: error.message }
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      const result = await this.razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: false,
      })

      return {
        success: true,
        subscriptionId: result.id,
        metadata: { status: result.status, canceledAt: new Date() },
      }
    } catch (error) {
      this.logger.error('Razorpay subscription cancellation failed', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a one-time payment link for upgrades/prorated charges
   */
  async createOneTimePaymentLink(
    amount: number,
    description: string,
    customerEmail: string,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; checkoutUrl?: string; paymentLinkId?: string; error?: string }> {
    try {
      const amountPaise = Math.round(amount * 100)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

      // Extract subscription ID and tenant ID from metadata if present (for upgrades)
      const subscriptionId = metadata?.subscriptionId
      const tenantId = metadata?.tenantId
      
      // Build callback URL with subscription ID if available
      let callbackUrl = `${frontendUrl}/subscription/success?provider=razorpay`
      if (tenantId) {
        callbackUrl += `&tenant_id=${tenantId}`
      }
      if (subscriptionId) {
        callbackUrl += `&db_subscription_id=${subscriptionId}`
      }

      // Create a payment link for one-time payment
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: amountPaise,
        currency: 'INR',
        description: description,
        customer: {
          email: customerEmail,
        },
        notify: {
          sms: false,
          email: true,
        },
        reminder_enable: false,
        callback_url: callbackUrl,
        callback_method: 'get',
        notes: metadata || {},
      })

      this.logger.log(`Created Razorpay payment link ${paymentLink.id} for amount ${amount}`)
      this.logger.log(`Callback URL: ${callbackUrl}`)

      return {
        success: true,
        checkoutUrl: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
      }
    } catch (error) {
      this.logger.error('Razorpay payment link creation failed', error)
      return { success: false, error: error.message }
    }
  }

  async verifyWebhook(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<WebhookVerificationResult> {
    try {
      const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload)
      const Razorpay = require('razorpay')
      const isValid = Razorpay.validateWebhookSignature(bodyString, signature, secret)
      return { isValid, event: isValid ? (typeof payload === 'string' ? JSON.parse(bodyString) : payload) : undefined }
    } catch (error) {
      this.logger.error('Razorpay webhook verification failed', error)
      return { isValid: false, error: error.message }
    }
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<{ status: string; currentPeriodEnd: Date }> {
    const sub = await this.razorpay.subscriptions.fetch(subscriptionId)
    const currentEnd = sub.current_end ? new Date(sub.current_end * 1000) : new Date()
    return { status: sub.status, currentPeriodEnd: currentEnd }
  }

  private mapBillingCycle(cycle: string): { period: string; interval: number; totalCount: number } {
    const c = (cycle || '').toLowerCase()
    if (c === 'monthly') return { period: 'monthly', interval: 1, totalCount: 12 }
    if (c === 'quarterly') return { period: 'monthly', interval: 3, totalCount: 4 }
    if (c === 'yearly' || c === 'annual') return { period: 'yearly', interval: 1, totalCount: 1 }
    return { period: 'monthly', interval: 1, totalCount: 12 }
  }
}