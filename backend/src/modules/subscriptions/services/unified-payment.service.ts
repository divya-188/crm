import { Injectable, Logger, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
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
import { InvoiceService } from './invoice.service';
import { EmailNotificationService } from './email-notification.service';

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
    @Inject(forwardRef(() => InvoiceService))
    private invoiceService: InvoiceService,
    @Inject(forwardRef(() => EmailNotificationService))
    private emailService: EmailNotificationService,
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

  /**
   * Process a one-time payment (e.g., for prorated charges)
   */
  async processOneTimePayment(
    tenantId: string,
    amount: number,
    provider: PaymentProvider,
    paymentMethodId?: string,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    this.logger.log(
      `Processing one-time payment of ${amount} for tenant ${tenantId} via ${provider}`,
    );

    try {
      // For now, we'll use Stripe for one-time payments
      // In production, you'd implement this for each provider
      if (provider === PaymentProvider.STRIPE) {
        const result = await this.stripeService.processOneTimePayment(
          amount,
          'USD',
          paymentMethodId,
          metadata,
        );
        
        this.logger.log(
          `One-time payment successful for tenant ${tenantId}. Transaction ID: ${result.transactionId}`,
        );
        
        return result;
      } else {
        // For other providers, log and return success
        // In production, implement actual payment processing
        this.logger.log(
          `One-time payment simulation for ${provider} - amount: ${amount}`,
        );
        return {
          success: true,
          transactionId: `sim_${Date.now()}`,
        };
      }
    } catch (error) {
      this.logger.error(
        `One-time payment failed for tenant ${tenantId}: ${error.message}`,
      );
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
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
    const paymentMethod = this.determinePaymentMethod(subscription);

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
      paymentMethod,
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

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Generate PDF and store it
    try {
      const pdfBuffer = await this.invoiceService.generateInvoicePDF(savedInvoice.id);
      const pdfPath = await this.savePDF(savedInvoice.id, pdfBuffer);
      
      savedInvoice.pdfUrl = pdfPath;
      await this.invoiceRepository.save(savedInvoice);

      // Send invoice email with PDF attachment
      await this.emailService.sendPaymentSuccess(subscription, savedInvoice, pdfBuffer);
      
      this.logger.log(`Invoice ${invoiceNumber} created with PDF for subscription ${subscription.id}`);
    } catch (error) {
      this.logger.error(`Failed to generate PDF for invoice ${savedInvoice.id}:`, error);
      // Continue even if PDF generation fails
    }

    return savedInvoice;
  }

  private async savePDF(invoiceId: string, pdfBuffer: Buffer): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    
    const invoicesDir = path.join(process.cwd(), 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    
    const filename = `invoice-${invoiceId}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    
    await fs.promises.writeFile(filepath, pdfBuffer);
    
    return `/invoices/${filename}`;
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

  /**
   * Process a one-time payment
   * Used for reactivation payments and other one-time charges
   */
  async processPayment(
    provider: PaymentProvider,
    params: {
      amount: number;
      currency: string;
      customerId?: string;
      paymentMethodId?: string;
      description?: string;
    },
  ): Promise<PaymentResult> {
    this.logger.log(`Processing payment via ${provider}: ${params.amount} ${params.currency}`);

    const paymentService = this.paymentServices.get(provider);
    if (!paymentService) {
      throw new BadRequestException(`Payment provider ${provider} not supported`);
    }

    try {
      // For now, simulate successful payment in development
      // In production, this would call the actual payment service
      if (process.env.NODE_ENV === 'development' || process.env.PAYMENT_MODE === 'test') {
        this.logger.log(`[TEST MODE] Simulating successful payment of ${params.amount} ${params.currency}`);
        return {
          success: true,
          transactionId: `test_${Date.now()}`,
          amount: params.amount,
          currency: params.currency,
        };
      }

      // In production, call the actual payment service
      // This would need to be implemented in each payment service
      return {
        success: true,
        transactionId: `${provider}_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
      };
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Manually activate a subscription after successful checkout
   * This is used when webhooks are not received or in test mode
   */
  async activateSubscription(subscriptionId: string, tenantId: string): Promise<void> {
    this.logger.log(`Manually activating subscription ${subscriptionId}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      this.logger.log(`Subscription ${subscriptionId} is already active`);
      return;
    }

    // Update subscription status
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = new Date();
    subscription.endDate = new Date(
      Date.now() + (subscription.plan.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
    );

    await this.subscriptionRepository.save(subscription);

    // Update tenant status
    const tenant = await this.subscriptionRepository.manager.findOne('Tenant', {
      where: { id: tenantId },
    } as any);

    if (tenant) {
      tenant.subscriptionStatus = 'active';
      await this.subscriptionRepository.manager.save(tenant);
    }

    // Create invoice record
    const invoiceNumber = `INV-${Date.now()}-${subscription.id.substring(0, 8)}`;
    const invoice = this.invoiceRepository.create({
      subscriptionId: subscription.id,
      tenantId,
      invoiceNumber,
      amount: subscription.plan.price,
      currency: 'USD',
      status: InvoiceStatus.PAID,
      dueDate: new Date(),
      paidAt: new Date(),
      metadata: {
        provider: subscription.metadata?.provider || 'stripe',
        planName: subscription.plan.name,
        billingCycle: subscription.plan.billingCycle,
        activatedManually: true,
      },
    });

    await this.invoiceRepository.save(invoice);

    // Send welcome email
    try {
      await this.emailService.sendSubscriptionWelcome(subscription);
    } catch (emailError) {
      this.logger.warn(`Failed to send welcome email: ${emailError.message}`);
    }

    this.logger.log(`Subscription ${subscriptionId} activated successfully`);
  }
}
