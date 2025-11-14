import { Injectable, Logger } from '@nestjs/common';
import { Subscription } from '../entities/subscription.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Email Notification Service for Subscription Events
 * 
 * This service handles sending email notifications for various subscription lifecycle events.
 * 
 * Email Provider Configuration:
 * Set EMAIL_PROVIDER in .env to one of: 'sendgrid', 'ses', 'smtp', 'console'
 * - sendgrid: Requires SENDGRID_API_KEY
 * - ses: Requires AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
 * - smtp: Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * - console: Logs emails to console (default for development)
 * 
 * Template System:
 * Uses Handlebars templates located in ./templates/
 */
@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly emailProvider: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly templatesPath: string;

  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'console';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@whatscrm.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'WhatsApp CRM';
    this.templatesPath = path.join(__dirname, '../templates');
    
    this.logger.log(`Email provider configured: ${this.emailProvider}`);
  }

  /**
   * Send email using configured provider
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const { to, subject, html, text } = params;

    switch (this.emailProvider) {
      case 'sendgrid':
        await this.sendViaSendGrid(to, subject, html, text);
        break;
      case 'ses':
        await this.sendViaSES(to, subject, html, text);
        break;
      case 'smtp':
        await this.sendViaSMTP(to, subject, html, text);
        break;
      case 'console':
      default:
        this.logEmailToConsole(to, subject, html);
        break;
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    // TODO: Implement SendGrid integration
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: this.fromEmail, subject, html, text });
    
    this.logger.log(`[SendGrid] Would send email to ${to}: ${subject}`);
    this.logEmailToConsole(to, subject, html);
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    // TODO: Implement AWS SES integration
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: process.env.AWS_REGION });
    // await ses.sendEmail({ ... }).promise();
    
    this.logger.log(`[AWS SES] Would send email to ${to}: ${subject}`);
    this.logEmailToConsole(to, subject, html);
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    // TODO: Implement SMTP integration
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ from: this.fromEmail, to, subject, html, text });
    
    this.logger.log(`[SMTP] Would send email to ${to}: ${subject}`);
    this.logEmailToConsole(to, subject, html);
  }

  /**
   * Log email to console (development mode)
   */
  private logEmailToConsole(to: string, subject: string, html: string): void {
    this.logger.log(`
╔════════════════════════════════════════════════════════════════
║ EMAIL NOTIFICATION
╠════════════════════════════════════════════════════════════════
║ To: ${to}
║ Subject: ${subject}
╠════════════════════════════════════════════════════════════════
║ HTML Content:
║ ${html.substring(0, 200)}...
╚════════════════════════════════════════════════════════════════
    `);
  }

  /**
   * Render email template with context
   */
  private renderTemplate(templateName: string, context: any): string {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      
      if (!fs.existsSync(templatePath)) {
        this.logger.warn(`Template not found: ${templatePath}, using fallback`);
        return this.generateFallbackHtml(templateName, context);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      
      // Simple template rendering (replace {{variable}} with values)
      let rendered = templateContent;
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, String(value || ''));
      }
      
      // Handle {{#each}} blocks for arrays
      rendered = this.handleEachBlocks(rendered, context);
      
      // Handle {{#if}} blocks
      rendered = this.handleIfBlocks(rendered, context);
      
      return rendered;
    } catch (error) {
      this.logger.error(`Error rendering template ${templateName}: ${error.message}`);
      return this.generateFallbackHtml(templateName, context);
    }
  }

  /**
   * Handle {{#each}} blocks in templates
   */
  private handleEachBlocks(template: string, context: any): string {
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    
    return template.replace(eachRegex, (match, arrayName, blockContent) => {
      const array = context[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = blockContent;
        if (typeof item === 'string') {
          itemContent = itemContent.replace(/{{this}}/g, item);
        } else {
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            itemContent = itemContent.replace(regex, String(value || ''));
          }
        }
        return itemContent;
      }).join('');
    });
  }

  /**
   * Handle {{#if}} blocks in templates
   */
  private handleIfBlocks(template: string, context: any): string {
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
    
    return template.replace(ifRegex, (match, condition, trueBlock, falseBlock) => {
      const value = context[condition];
      if (value) {
        return trueBlock;
      } else if (falseBlock) {
        return falseBlock;
      }
      return '';
    });
  }

  /**
   * Generate fallback HTML when template is not available
   */
  private generateFallbackHtml(templateName: string, context: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${templateName}</h2>
          <pre>${JSON.stringify(context, null, 2)}</pre>
        </body>
      </html>
    `;
  }

  /**
   * Send renewal success email
   */
  async sendRenewalSuccess(
    subscription: Subscription,
    newEndDate: Date,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const currency = 'USD';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      amount: subscription.plan?.price,
      currency,
      billingCycle: subscription.plan?.billingCycle,
      newEndDate: newEndDate.toLocaleDateString(),
      subscriptionId: subscription.id,
    };

    const html = this.renderTemplate('payment-success', context);
    const text = this.generateRenewalSuccessEmail(subscription, newEndDate, currency);

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Renewed Successfully',
      html,
      text,
    });
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

    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      attemptNumber,
      maxAttempts: 3,
      nextRetryDate: nextRetryDate.toLocaleDateString(),
      error,
      updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-method`,
      subscriptionId: subscription.id,
    };

    const html = this.renderTemplate('payment-failed', context);
    const text = this.generateRenewalFailureEmail(
      subscription,
      attemptNumber,
      nextRetryDate,
      error,
    );

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Renewal Failed - Action Required',
      html,
      text,
    });
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

    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      daysRemaining,
      gracePeriodEnd: gracePeriodEnd.toLocaleDateString(),
      updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-method`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
      subscriptionId: subscription.id,
    };

    const html = this.renderTemplate('payment-failed', context);
    const text = this.generatePastDueWarningEmail(subscription, gracePeriodEnd, daysRemaining);

    await this.sendEmail({
      to: customerEmail,
      subject: 'URGENT: Subscription Payment Failed - Service Will Be Suspended',
      html,
      text,
    });
  }

  /**
   * Send subscription welcome email
   */
  async sendSubscriptionWelcome(subscription: Subscription): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      features: subscription.plan?.features || [],
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
    };

    const html = this.renderTemplate('subscription-welcome', context);
    const text = this.generateWelcomeEmail(subscription);

    await this.sendEmail({
      to: customerEmail,
      subject: 'Welcome to WhatsApp CRM!',
      html,
      text,
    });
  }

  /**
   * Send payment success email with invoice PDF attachment
   */
  async sendPaymentSuccess(
    subscription: Subscription,
    invoice: any,
    pdfBuffer?: Buffer,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const amount = invoice.total || invoice.amount;
    const currency = invoice.currency || 'USD';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      invoiceNumber: invoice.invoiceNumber,
      amount,
      currency,
      planName: subscription.plan?.name,
      billingCycle: subscription.plan?.billingCycle,
      invoiceUrl: `${process.env.FRONTEND_URL}/subscriptions/invoices/${invoice.id}/download`,
    };

    const html = this.renderTemplate('payment-success', context);
    const text = this.generatePaymentSuccessEmail(subscription, invoice.invoiceNumber, amount, currency);

    await this.sendEmailWithAttachment({
      to: customerEmail,
      subject: 'Payment Received - Invoice Attached',
      html,
      text,
      attachments: pdfBuffer ? [{
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }] : undefined,
    });
  }

  /**
   * Send email with attachments
   */
  private async sendEmailWithAttachment(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<void> {
    const { to, subject, html, text, attachments } = params;

    // For now, just log that we would send with attachment
    // In production, this would use the actual email provider's attachment API
    if (attachments && attachments.length > 0) {
      this.logger.log(`Would send email to ${to} with ${attachments.length} attachment(s)`);
      attachments.forEach(att => {
        this.logger.log(`  - ${att.filename} (${att.contentType}, ${att.content.length} bytes)`);
      });
    }

    // Fall back to regular email sending
    await this.sendEmail({ to, subject, html, text });
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
    const context = {
      tenantName,
      resourceType,
      percentage,
      currentUsage,
      limit,
      upgradeUrl: `${process.env.FRONTEND_URL}/subscription-plans`,
    };

    const html = this.renderTemplate('quota-warning', context);
    const text = this.generateQuotaWarningEmail(
      tenantName,
      resourceType,
      percentage,
      currentUsage,
      limit,
    );

    await this.sendEmail({
      to: tenantEmail,
      subject: `Quota Warning: ${resourceType} at ${percentage}%`,
      html,
      text,
    });
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
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      amount: subscription.plan?.price,
      currency,
      daysUntilRenewal,
      renewalDate: subscription.endDate.toLocaleDateString(),
      manageSubscriptionUrl: `${process.env.FRONTEND_URL}/billing/subscription`,
    };

    const html = this.renderTemplate('renewal-reminder', context);
    const text = this.generateRenewalReminderEmail(subscription, daysUntilRenewal, currency);

    await this.sendEmail({
      to: customerEmail,
      subject: `Subscription Renewal in ${daysUntilRenewal} Days`,
      html,
      text,
    });
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
   * Send upgrade confirmation email
   */
  async sendUpgradeConfirmation(
    subscription: Subscription,
    newPlan: any,
    proratedAmount: number,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const currency = 'USD';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      oldPlanName: subscription.plan?.name,
      newPlanName: newPlan.name,
      proratedAmount,
      currency,
      effectiveDate: new Date().toLocaleDateString(),
      newFeatures: newPlan.features || [],
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    };

    const html = this.renderTemplate('subscription-welcome', context);
    const text = this.generateUpgradeConfirmationEmail(
      subscription,
      newPlan,
      proratedAmount,
      currency,
    );

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Upgraded Successfully',
      html,
      text,
    });
  }

  /**
   * Send downgrade confirmation email
   */
  async sendDowngradeConfirmation(
    subscription: Subscription,
    newPlan: any,
    effectiveDate: Date,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      currentPlanName: subscription.plan?.name,
      newPlanName: newPlan.name,
      effectiveDate: effectiveDate.toLocaleDateString(),
      newFeatures: newPlan.features || [],
      manageSubscriptionUrl: `${process.env.FRONTEND_URL}/billing/subscription`,
    };

    const html = this.renderTemplate('subscription-welcome', context);
    const text = this.generateDowngradeConfirmationEmail(
      subscription,
      newPlan,
      effectiveDate,
    );

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Downgrade Scheduled',
      html,
      text,
    });
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
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      cancelImmediately,
      serviceEndDate: serviceEndDate.toLocaleDateString(),
      cancellationReason: subscription.cancellationReason,
      reactivateUrl: `${process.env.FRONTEND_URL}/subscription-plans`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
    };

    const html = this.renderTemplate('subscription-cancelled', context);
    const text = this.generateCancellationConfirmationEmail(
      subscription,
      cancelImmediately,
      serviceEndDate,
    );

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Cancellation Confirmation',
      html,
      text,
    });
  }

  private generateUpgradeConfirmationEmail(
    subscription: Subscription,
    newPlan: any,
    proratedAmount: number,
    currency: string,
  ): string {
    const proratedMessage = proratedAmount > 0
      ? `A prorated charge of ${currency} ${proratedAmount.toFixed(2)} has been applied to your account for the remaining period.`
      : 'No additional charge was required for this upgrade.';

    return `
Subscription Upgraded Successfully

Dear ${subscription.tenant?.name || 'Customer'},

Great news! Your subscription has been upgraded successfully.

Upgrade Details:
- Previous Plan: ${subscription.plan?.name}
- New Plan: ${newPlan.name}
- Effective Date: ${new Date().toLocaleDateString()}
- ${proratedMessage}

You now have access to all the enhanced features of the ${newPlan.name} plan!

Visit your dashboard to explore your new capabilities:
${process.env.FRONTEND_URL}/dashboard

If you have any questions, please contact our support team.

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  private generateDowngradeConfirmationEmail(
    subscription: Subscription,
    newPlan: any,
    effectiveDate: Date,
  ): string {
    return `
Subscription Downgrade Scheduled

Dear ${subscription.tenant?.name || 'Customer'},

Your subscription downgrade has been scheduled.

Downgrade Details:
- Current Plan: ${subscription.plan?.name}
- New Plan: ${newPlan.name}
- Effective Date: ${effectiveDate.toLocaleDateString()}

Your current plan will remain active until ${effectiveDate.toLocaleDateString()}. After this date, your subscription will be downgraded to the ${newPlan.name} plan.

Important: Please ensure your current usage is within the limits of the new plan before the effective date to avoid service interruption.

To cancel this downgrade or manage your subscription:
${process.env.FRONTEND_URL}/billing/subscription

If you have any questions, please contact our support team.

Best regards,
WhatsApp CRM Team
    `.trim();
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

  /**
   * Send subscription suspended email
   */
  async sendSubscriptionSuspended(subscription: Subscription): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      suspendedDate: new Date().toLocaleDateString(),
      reactivateUrl: `${process.env.FRONTEND_URL}/billing/reactivate`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@whatscrm.com',
    };

    const html = this.renderTemplate('subscription-cancelled', context);
    const text = this.generateSubscriptionSuspendedEmail(subscription);

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Suspended - Payment Required',
      html,
      text,
    });
  }

  private generateSubscriptionSuspendedEmail(subscription: Subscription): string {
    return `
Subscription Suspended

Dear ${subscription.tenant?.name || 'Customer'},

Your ${subscription.plan?.name} subscription has been suspended due to payment failure.

Your service access has been blocked. All resource creation and API access have been disabled.

To reactivate your subscription:
1. Update your payment method
2. Process the outstanding payment
3. Your service will be restored immediately

Reactivate your subscription:
${process.env.FRONTEND_URL}/billing/reactivate

If you need assistance or have questions, please contact our support team at ${process.env.SUPPORT_EMAIL || 'support@whatscrm.com'}

Best regards,
WhatsApp CRM Team
    `.trim();
  }

  /**
   * Send subscription reactivated email
   */
  async sendSubscriptionReactivated(
    subscription: Subscription,
    newEndDate: Date,
  ): Promise<void> {
    const customerEmail = subscription.metadata?.customerEmail || 'customer@example.com';
    const currency = 'USD';
    
    const context = {
      tenantName: subscription.tenant?.name || 'Customer',
      planName: subscription.plan?.name,
      amount: subscription.plan?.price,
      currency,
      newEndDate: newEndDate.toLocaleDateString(),
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    };

    const html = this.renderTemplate('subscription-welcome', context);
    const text = this.generateSubscriptionReactivatedEmail(subscription, newEndDate, currency);

    await this.sendEmail({
      to: customerEmail,
      subject: 'Subscription Reactivated Successfully',
      html,
      text,
    });
  }

  private generateSubscriptionReactivatedEmail(
    subscription: Subscription,
    newEndDate: Date,
    currency: string,
  ): string {
    return `
Subscription Reactivated Successfully

Dear ${subscription.tenant?.name || 'Customer'},

Great news! Your ${subscription.plan?.name} subscription has been reactivated.

Subscription Details:
- Plan: ${subscription.plan?.name}
- Amount Paid: ${currency} ${subscription.plan?.price}
- Service Active Until: ${newEndDate.toLocaleDateString()}

Your service access has been fully restored. You can now:
- Create and manage resources
- Access all plan features
- Use the API without restrictions

Visit your dashboard to get started:
${process.env.FRONTEND_URL}/dashboard

Thank you for continuing to use WhatsApp CRM!

If you have any questions, please contact our support team.

Best regards,
WhatsApp CRM Team
    `.trim();
  }
}
