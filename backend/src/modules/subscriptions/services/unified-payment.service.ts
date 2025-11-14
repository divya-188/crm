import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { StripePaymentService } from './stripe-payment.service';
import { PayPalPaymentService } from './paypal-payment.service';
import { RazorpayPaymentService } from './razorpay-payment.service';
import { IPaymentService, PaymentResult } from './payment.interface';
import { PaymentProvider } from '../dto/create-subscription.dto';

@Injectable()
export class UnifiedPaymentService {
  private readonly logger = new Logger(UnifiedPaymentService.name);
  private paymentServices: Map<string, IPaymentService>;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private stripeService: StripePaymentService,
    private paypalService: PayPalPaymentService,
    private razorpayService: RazorpayPaymentService,
  ) {
    this.paymentServices = new Map<string, IPaymentService>();
    this.paymentServices.set(PaymentProvider.STRIPE, this.stripeService);
    this.paymentServices.set(PaymentProvider.PAYPAL, this.paypalService);
    this.paymentServices.set(PaymentProvider.RAZORPAY, this.razorpayService);
  }

  async createSubscription(
    tenantId: string,
    planId: string,
    provider: PaymentProvider,
    customerEmail: string,
    paymentMethodId?: string,
  ): Promise<Subscription> {
    // Get plan details
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    // Get payment service
    const paymentService = this.paymentServices.get(provider);
    if (!paymentService) {
      throw new BadRequestException('Invalid payment provider');
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan.billingCycle);

    // Create pending subscription record first
    const pendingSubscription = this.subscriptionRepository.create({
      tenantId,
      planId,
      status: 'pending' as any, // Pending until payment succeeds
      startDate,
      endDate,
      metadata: {
        provider,
        customerEmail,
        planName: plan.name,
        planPrice: plan.price,
        billingCycle: plan.billingCycle,
      },
    });

    await this.subscriptionRepository.save(pendingSubscription);

    this.logger.log(
      `Pending subscription created for tenant ${tenantId} with ${provider}`,
    );

    // Create subscription with payment provider
    const result = await paymentService.createSubscription(
      tenantId,
      planId,
      Number(plan.price),
      plan.billingCycle,
      customerEmail,
      paymentMethodId,
    );

    if (!result.success) {
      // Update subscription to failed status
      pendingSubscription.status = 'payment_failed' as any;
      await this.subscriptionRepository.save(pendingSubscription);
      
      throw new BadRequestException(
        `Payment failed: ${result.error}`,
      );
    }

    // Update subscription with provider IDs
    pendingSubscription.stripeSubscriptionId =
      provider === PaymentProvider.STRIPE ? result.subscriptionId : null;
    pendingSubscription.paypalSubscriptionId =
      provider === PaymentProvider.PAYPAL ? result.subscriptionId : null;
    pendingSubscription.razorpaySubscriptionId =
      provider === PaymentProvider.RAZORPAY ? result.subscriptionId : null;
    
    // If payment method was provided, activate immediately
    // Otherwise, subscription will be activated via webhook
    if (paymentMethodId || result.metadata?.status === 'active') {
      pendingSubscription.status = SubscriptionStatus.ACTIVE;
    }
    
    pendingSubscription.metadata = {
      ...pendingSubscription.metadata,
      ...result.metadata,
      checkoutUrl: result.checkoutUrl,
    };

    await this.subscriptionRepository.save(pendingSubscription);

    this.logger.log(
      `Subscription ${pendingSubscription.status} for tenant ${tenantId} with ${provider}`,
    );

    return pendingSubscription;
  }

  async cancelSubscription(
    subscriptionId: string,
    provider: PaymentProvider,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // Get payment service
    const paymentService = this.paymentServices.get(provider);
    if (!paymentService) {
      throw new BadRequestException('Invalid payment provider');
    }

    // Get provider subscription ID
    const providerSubscriptionId = this.getProviderSubscriptionId(
      subscription,
      provider,
    );

    if (!providerSubscriptionId) {
      throw new BadRequestException(
        'Provider subscription ID not found',
      );
    }

    // Cancel with payment provider
    const result = await paymentService.cancelSubscription(
      providerSubscriptionId,
    );

    if (!result.success) {
      throw new BadRequestException(
        `Cancellation failed: ${result.error}`,
      );
    }

    // Update subscription record
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `Subscription ${subscriptionId} cancelled with ${provider}`,
    );

    return subscription;
  }

  async handleWebhook(
    provider: PaymentProvider,
    payload: any,
    signature: string,
  ): Promise<void> {
    const paymentService = this.paymentServices.get(provider);
    if (!paymentService) {
      throw new BadRequestException('Invalid payment provider');
    }

    const secret = this.getWebhookSecret(provider);
    const verification = await paymentService.verifyWebhook(
      payload,
      signature,
      secret,
    );

    if (!verification.isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process webhook event
    await this.processWebhookEvent(provider, verification.event);
  }

  async syncSubscriptionStatus(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    // Determine provider
    const provider = this.determineProvider(subscription);
    const paymentService = this.paymentServices.get(provider);

    if (!paymentService) {
      throw new BadRequestException('Payment provider not found');
    }

    const providerSubscriptionId = this.getProviderSubscriptionId(
      subscription,
      provider,
    );

    if (!providerSubscriptionId) {
      return subscription;
    }

    // Get status from provider
    const status = await paymentService.getSubscriptionStatus(
      providerSubscriptionId,
    );

    // Update subscription
    subscription.status = this.mapProviderStatus(status.status);
    subscription.endDate = status.currentPeriodEnd;
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  private calculateEndDate(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
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

  private determineProvider(subscription: Subscription): PaymentProvider {
    if (subscription.stripeSubscriptionId) return PaymentProvider.STRIPE;
    if (subscription.paypalSubscriptionId) return PaymentProvider.PAYPAL;
    if (subscription.razorpaySubscriptionId) return PaymentProvider.RAZORPAY;
    throw new BadRequestException('No payment provider found for subscription');
  }

  private getWebhookSecret(provider: PaymentProvider): string {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return process.env.STRIPE_WEBHOOK_SECRET || '';
      case PaymentProvider.PAYPAL:
        return process.env.PAYPAL_WEBHOOK_SECRET || '';
      case PaymentProvider.RAZORPAY:
        return process.env.RAZORPAY_WEBHOOK_SECRET || '';
      default:
        return '';
    }
  }

  private async processWebhookEvent(
    provider: PaymentProvider,
    event: any,
  ): Promise<void> {
    this.logger.log(`Processing ${provider} webhook event: ${event.type || event.event_type}`);

    // Handle different event types based on provider
    switch (provider) {
      case PaymentProvider.STRIPE:
        await this.processStripeEvent(event);
        break;
      case PaymentProvider.PAYPAL:
        await this.processPayPalEvent(event);
        break;
      case PaymentProvider.RAZORPAY:
        await this.processRazorpayEvent(event);
        break;
    }
  }

  private async processStripeEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.updated':
        await this.updateSubscriptionFromStripe(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.updateSubscriptionFromStripe(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        this.logger.log('Payment succeeded for invoice');
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'invoice.payment_failed':
        this.logger.warn('Payment failed for invoice');
        await this.handlePaymentFailure(event.data.object);
        break;
    }
  }

  private async processPayPalEvent(event: any): Promise<void> {
    // Handle PayPal webhook events
    this.logger.log(`PayPal event: ${event.event_type}`);
  }

  private async processRazorpayEvent(event: any): Promise<void> {
    switch (event.event) {
      case 'subscription.charged':
        this.logger.log('Razorpay subscription charged');
        break;
      case 'subscription.cancelled':
        await this.updateSubscriptionFromRazorpay(event.payload.subscription.entity);
        break;
    }
  }

  private async updateSubscriptionFromStripe(stripeSubscription: any): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (subscription) {
      subscription.status = this.mapProviderStatus(stripeSubscription.status);
      subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
      await this.subscriptionRepository.save(subscription);
    }
  }

  private async updateSubscriptionFromRazorpay(razorpaySubscription: any): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { razorpaySubscriptionId: razorpaySubscription.id },
    });

    if (subscription) {
      subscription.status = this.mapProviderStatus(razorpaySubscription.status);
      await this.subscriptionRepository.save(subscription);
    }
  }

  private async handlePaymentSuccess(invoice: any): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: invoice.subscription },
      relations: ['plan'],
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    // Activate subscription if it was pending or past due
    if (
      subscription.status === SubscriptionStatus.PENDING ||
      subscription.status === SubscriptionStatus.PAST_DUE ||
      subscription.status === 'payment_failed' as any
    ) {
      subscription.status = SubscriptionStatus.ACTIVE;
      
      // Set subscription dates if not already set
      if (!subscription.startDate) {
        subscription.startDate = new Date();
      }
      if (!subscription.endDate) {
        subscription.endDate = this.calculateEndDate(
          subscription.startDate,
          subscription.plan.billingCycle,
        );
      }
      
      await this.subscriptionRepository.save(subscription);

      // Update tenant status
      const tenant = await this.subscriptionRepository.manager.findOne('Tenant', {
        where: { id: subscription.tenantId },
      } as any);

      if (tenant && tenant.status === 'suspended') {
        tenant.status = 'active';
        await this.subscriptionRepository.manager.save(tenant);
      }

      this.logger.log(`Subscription ${subscription.id} activated after payment success`);
    }

    // Create invoice record
    await this.createInvoiceRecord(subscription, invoice);
  }

  private async createInvoiceRecord(
    subscription: Subscription,
    paymentData: any,
  ): Promise<Invoice> {
    const plan = subscription.plan;
    const amount = Number(plan.price);
    const tax = 0; // Calculate tax if needed
    const total = amount + tax;

    const invoiceNumber = this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      invoiceNumber,
      amount,
      tax,
      total,
      currency: 'USD',
      status: InvoiceStatus.PAID,
      invoiceDate: new Date(),
      dueDate: new Date(),
      paidAt: new Date(),
      paymentMethod: this.determinePaymentMethod(subscription),
      stripeInvoiceId: paymentData.id || null,
      items: [
        {
          description: `${plan.name} - ${plan.billingCycle} subscription`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      metadata: {
        paymentIntentId: paymentData.payment_intent,
        chargeId: paymentData.charge,
      },
    });

    await this.invoiceRepository.save(invoice);

    this.logger.log(`Invoice ${invoiceNumber} created for subscription ${subscription.id}`);

    return invoice;
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `INV-${year}-${timestamp}-${random}`;
  }

  private determinePaymentMethod(subscription: Subscription): string {
    if (subscription.stripeSubscriptionId) return 'Stripe';
    if (subscription.paypalSubscriptionId) return 'PayPal';
    if (subscription.razorpaySubscriptionId) return 'Razorpay';
    return 'Unknown';
  }

  private async handlePaymentFailure(invoice: any): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      await this.subscriptionRepository.save(subscription);
      this.logger.warn(`Subscription ${subscription.id} marked as past due after payment failure`);
    }
  }

  private mapProviderStatus(providerStatus: string): typeof SubscriptionStatus[keyof typeof SubscriptionStatus] {
    const statusMap: Record<string, typeof SubscriptionStatus[keyof typeof SubscriptionStatus]> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELLED,
      cancelled: SubscriptionStatus.CANCELLED,
      expired: SubscriptionStatus.EXPIRED,
      past_due: SubscriptionStatus.PAST_DUE,
      incomplete: SubscriptionStatus.PAST_DUE,
    };

    return statusMap[providerStatus.toLowerCase()] || SubscriptionStatus.ACTIVE;
  }
}
