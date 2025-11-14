import { Injectable, Logger } from '@nestjs/common';
import { Subscription } from '../entities/subscription.entity';

/**
 * Email Notification Service for Subscription Events
 * 
 * This service handles sending email notifications for various subscription lifecycle events.
 * In a production environment, this would integrate with an email service provider like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Postmark
 * 
 * For now, it logs the email content that would be sent.
 */
@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  /**
   * Send renewal success email
   */
  async sendRenewalSuccess(
    subscription: Subscription,
    newEndDate: Date,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const currency = 'USD'; // Default currency
    
    const emailContent = {
      to: customerEmail,
      subject: 'Subscription Renewed Successfully',
      template: 'renewal-success',
      context: {
        tenantName: subscription.tenant?.name,
        planName: subscription.plan?.name,
        amount: subscription.plan?.price,
        currency,
        billingCycle: subscription.plan?.billingCycle,
        newEndDate: newEndDate.toLocaleDateString(),
        subscriptionId: subscription.id,
      },
      body: this.generateRenewalSuccessEmail(subscription, newEndDate, currency),
    };

    this.logger.log(
      `[EMAIL] Renewal success email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  /**
   * Send renewal failure email
   */
  async sendRenewalFailure(
    subscription: Subscription,
    attemptNumber: number,
    error: string,
  ): Promise<void> {
    const nextRetryDate = new Date();
    nextRetryDate.setHours(nextRetryDate.getHours() + 24);
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';

    const emailContent = {
      to: customerEmail,
      subject: 'Subscription Renewal Failed - Action Required',
      template: 'renewal-failure',
      context: {
        tenantName: subscription.tenant?.name,
        planName: subscription.plan?.name,
        attemptNumber,
        maxAttempts: 3,
        nextRetryDate: nextRetryDate.toLocaleDateString(),
        error,
        updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-method`,
        subscriptionId: subscription.id,
      },
      body: this.generateRenewalFailureEmail(
        subscription,
        attemptNumber,
        nextRetryDate,
        error,
      ),
    };

    this.logger.warn(
      `[EMAIL] Renewal failure email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  /**
   * Send past due warning email
   */
  async sendPastDueWarning(
    subscription: Subscription,
    gracePeriodEnd: Date,
  ): Promise<void> {
    const daysRemaining = Math.ceil(
      (gracePeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';

    const emailContent = {
      to: customerEmail,
      subject: 'URGENT: Subscription Payment Failed - Service Will Be Suspended',
      template: 'past-due-warning',
      context: {
        tenantName: subscription.tenant?.name,
        planName: subscription.plan?.name,
        daysRemaining,
        gracePeriodEnd: gracePeriodEnd.toLocaleDateString(),
        updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-method`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
        subscriptionId: subscription.id,
      },
      body: this.generatePastDueWarningEmail(subscription, gracePeriodEnd, daysRemaining),
    };

    this.logger.warn(
      `[EMAIL] Past due warning email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  /**
   * Send subscription welcome email
   */
  async sendSubscriptionWelcome(subscription: Subscription): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    
    const emailContent = {
      to: customerEmail,
      subject: 'Welcome to WhatsApp CRM!',
      template: 'subscription-welcome',
      context: {
        tenantName: subscription.tenant?.name,
        planName: subscription.plan?.name,
        features: subscription.plan?.features,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
      },
      body: this.generateWelcomeEmail(subscription),
    };

    this.logger.log(
      `[EMAIL] Welcome email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccess(
    subscription: Subscription,
    invoiceNumber: string,
    amount: number,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const currency = 'USD';
    
    const emailContent = {
      to: customerEmail,
      subject: 'Payment Received - Invoice Attached',
      template: 'payment-success',
      context: {
        tenantName: subscription.tenant?.name,
        invoiceNumber,
        amount,
        currency,
        planName: subscription.plan?.name,
        billingCycle: subscription.plan?.billingCycle,
        invoiceUrl: `${process.env.FRONTEND_URL}/billing/invoices/${invoiceNumber}`,
      },
      body: this.generatePaymentSuccessEmail(subscription, invoiceNumber, amount, currency),
    };

    this.logger.log(
      `[EMAIL] Payment success email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  /**
   * Send quota warning email
   */
  async sendQuotaWarning(
    tenantEmail: string,
    tenantName: string,
    resourceType: string,
    percentage: number,
    currentUsage: number,
    limit: number,
  ): Promise<void> {
    const emailContent = {
      to: tenantEmail,
      subject: `Quota Warning: ${resourceType} at ${percentage}%`,
      template: 'quota-warning',
      context: {
        tenantName,
        resourceType,
        percentage,
        currentUsage,
        limit,
        upgradeUrl: `${process.env.FRONTEND_URL}/subscription-plans`,
      },
      body: this.generateQuotaWarningEmail(
        tenantName,
        resourceType,
        percentage,
        currentUsage,
        limit,
      ),
    };

    this.logger.warn(
      `[EMAIL] Quota warning email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  /**
   * Send renewal reminder email
   */
  async sendRenewalReminder(
    subscription: Subscription,
    daysUntilRenewal: number,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const currency = 'USD';
    
    const emailContent = {
      to: customerEmail,
      subject: `Subscription Renewal in ${daysUntilRenewal} Days`,
      template: 'renewal-reminder',
      context: {
        tenantName: subscription.tenant?.name,
        planName: subscription.plan?.name,
        amount: subscription.plan?.price,
        currency,
        daysUntilRenewal,
        renewalDate: subscription.endDate.toLocaleDateString(),
        manageSubscriptionUrl: `${process.env.FRONTEND_URL}/billing/subscription`,
      },
      body: this.generateRenewalReminderEmail(subscription, daysUntilRenewal, currency),
    };

    this.logger.log(
      `[EMAIL] Renewal reminder email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  // Email template generators

  private generateRenewalSuccessEmail(
    subscription: Subscription,
    newEndDate: Date,
    currency: string,
  ): string {
    return `
Dear ${subscription.tenant?.name || 'Customer'},

Your subscription has been successfully renewed!

Plan: ${subscription.plan?.name}
Amount: ${currency} ${subscription.plan?.price}
Billing Cycle: ${subscription.plan?.billingCycle}
Next Renewal Date: ${newEndDate.toLocaleDateString()}

Thank you for continuing to use WhatsApp CRM. Your service will continue uninterrupted.

If you have any questions, please contact our support team.

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generateRenewalFailureEmail(
    subscription: Subscription,
    attemptNumber: number,
    nextRetryDate: Date,
    error: string,
  ): string {
    return `
Dear ${subscription.tenant?.name || 'Customer'},

We were unable to process your subscription renewal payment.

Plan: ${subscription.plan?.name}
Attempt: ${attemptNumber} of 3
Error: ${error}

We will automatically retry the payment on ${nextRetryDate.toLocaleDateString()}.

To avoid service interruption, please update your payment method at:
${process.env.FRONTEND_URL}/billing/payment-method

If you need assistance, please contact our support team.

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generatePastDueWarningEmail(
    subscription: Subscription,
    gracePeriodEnd: Date,
    daysRemaining: number,
  ): string {
    return `
URGENT: Action Required

Dear ${subscription.tenant?.name || 'Customer'},

Your subscription payment has failed after multiple attempts. Your account is now in a grace period.

Plan: ${subscription.plan?.name}
Days Remaining: ${daysRemaining}
Service Suspension Date: ${gracePeriodEnd.toLocaleDateString()}

Your service will be suspended on ${gracePeriodEnd.toLocaleDateString()} if payment is not received.

Please update your payment method immediately at:
${process.env.FRONTEND_URL}/billing/payment-method

If you need assistance, please contact our support team at ${process.env.SUPPORT_EMAIL || 'support@whatscrm.com'}

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generateWelcomeEmail(subscription: Subscription): string {
    return `
Welcome to WhatsApp CRM!

Dear ${subscription.tenant?.name || 'Customer'},

Thank you for subscribing to ${subscription.plan?.name}!

Your subscription is now active and you have access to all the features included in your plan.

Get started by visiting your dashboard:
${process.env.FRONTEND_URL}/dashboard

If you have any questions, our support team is here to help at ${process.env.SUPPORT_EMAIL || 'support@whatscrm.com'}

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generatePaymentSuccessEmail(
    subscription: Subscription,
    invoiceNumber: string,
    amount: number,
    currency: string,
  ): string {
    return `
Payment Received

Dear ${subscription.tenant?.name || 'Customer'},

We have successfully received your payment.

Invoice Number: ${invoiceNumber}
Amount: ${currency} ${amount}
Plan: ${subscription.plan?.name}
Billing Cycle: ${subscription.plan?.billingCycle}

You can download your invoice at:
${process.env.FRONTEND_URL}/billing/invoices/${invoiceNumber}

Thank you for your payment!

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generateQuotaWarningEmail(
    tenantName: string,
    resourceType: string,
    percentage: number,
    currentUsage: number,
    limit: number,
  ): string {
    return `
Quota Warning

Dear ${tenantName},

You are approaching your ${resourceType} quota limit.

Current Usage: ${currentUsage} of ${limit} (${percentage}%)

To avoid service interruption, consider upgrading your plan:
${process.env.FRONTEND_URL}/subscription-plans

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generateRenewalReminderEmail(
    subscription: Subscription,
    daysUntilRenewal: number,
    currency: string,
  ): string {
    return `
Subscription Renewal Reminder

Dear ${subscription.tenant?.name || 'Customer'},

Your subscription will renew in ${daysUntilRenewal} days.

Plan: ${subscription.plan?.name}
Amount: ${currency} ${subscription.plan?.price}
Renewal Date: ${subscription.endDate.toLocaleDateString()}

Your payment method will be automatically charged on the renewal date.

To manage your subscription or update your payment method:
${process.env.FRONTEND_URL}/billing/subscription

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(
    subscription: Subscription,
    cancelImmediately: boolean,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const serviceEndDate = cancelImmediately 
      ? new Date() 
      : subscription.endDate;
    
    const emailContent = {
      to: customerEmail,
      subject: 'Subscription Cancellation Confirmation',
      template: 'subscription-cancelled',
      context: {
        tenantName: subscription.tenant?.name,
        planName: subscription.plan?.name,
        cancelImmediately,
        serviceEndDate: serviceEndDate.toLocaleDateString(),
        cancellationReason: subscription.cancellationReason,
        reactivateUrl: `${process.env.FRONTEND_URL}/subscription-plans`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
      },
      body: this.generateCancellationConfirmationEmail(
        subscription,
        cancelImmediately,
        serviceEndDate,
      ),
    };

    this.logger.log(
      `[EMAIL] Cancellation confirmation email would be sent to ${emailContent.to}`,
    );
    this.logger.debug(`Email content: ${JSON.stringify(emailContent, null, 2)}`);

    // TODO: Integrate with actual email service provider
    // await this.emailProvider.send(emailContent);
  }

  private generateCancellationConfirmationEmail(
    subscription: Subscription,
    cancelImmediately: boolean,
    serviceEndDate: Date,
  ): string {
    const immediateMessage = cancelImmediately
      ? 'Your subscription has been cancelled immediately and your service access has ended.'
      : `Your subscription will remain active until ${serviceEndDate.toLocaleDateString()}. After this date, your service access will end.`;

    return `
Subscription Cancellation Confirmation

Dear ${subscription.tenant?.name || 'Customer'},

We have received your cancellation request for your ${subscription.plan?.name} subscription.

${immediateMessage}

Cancellation Details:
- Plan: ${subscription.plan?.name}
- Service End Date: ${serviceEndDate.toLocaleDateString()}
- Reason: ${subscription.cancellationReason || 'Not provided'}

We're sorry to see you go! If you change your mind, you can reactivate your subscription at any time:
${process.env.FRONTEND_URL}/subscription-plans

If you have any questions or feedback about your experience, please contact our support team at ${process.env.SUPPORT_EMAIL || 'support@whatscrm.com'}

Thank you for using WhatsApp CRM.

Best regards,
WhatsApp CRM Team
    `.trim();
  }
}
