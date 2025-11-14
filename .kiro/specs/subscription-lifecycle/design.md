# Subscription Lifecycle Design

## Overview

This design implements a complete subscription lifecycle management system with quota enforcement, payment processing, and automated billing. The system integrates with multiple payment gateways and provides comprehensive email notifications.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Subscriptions│  │   Webhooks   │  │   Invoices   │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Subscription │  │    Quota     │  │   Invoice    │      │
│  │   Lifecycle  │  │ Enforcement  │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Unified    │  │    Email     │  │   Scheduler  │      │
│  │   Payment    │  │ Notification │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│              Payment Gateway Adapters                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Stripe    │  │    PayPal    │  │  Razorpay    │      │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### 1. Quota Guard

**Purpose:** Intercept resource creation requests and enforce quota limits

**Implementation:**
```typescript
@Injectable()
export class QuotaGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user.tenantId;
    const resourceType = this.getResourceType(context);
    
    const canCreate = await this.quotaService.checkQuota(
      tenantId,
      resourceType
    );
    
    if (!canCreate) {
      throw new ForbiddenException({
        message: 'Quota limit exceeded',
        resourceType,
        upgradeUrl: '/subscription-plans'
      });
    }
    
    return true;
  }
}
```

**Usage:** Apply to POST endpoints for resource creation
```typescript
@Post()
@UseGuards(JwtAuthGuard, QuotaGuard)
@QuotaResource('contacts')
create(@Body() dto: CreateContactDto) {
  // ...
}
```


### 2. Subscription Creation Flow

**Sequence Diagram:**
```
Tenant Admin → API: POST /subscriptions
API → SubscriptionService: createSubscription()
SubscriptionService → DB: Create pending subscription
SubscriptionService → PaymentGateway: Create checkout session
PaymentGateway → API: Return checkout URL
API → Tenant Admin: Redirect to checkout
Tenant Admin → PaymentGateway: Complete payment
PaymentGateway → API: Webhook: payment.succeeded
API → SubscriptionService: activateSubscription()
SubscriptionService → DB: Update status to 'active'
SubscriptionService → EmailService: Send welcome email
```

**Key Methods:**
- `createSubscription(tenantId, planId, provider, paymentMethodId)`
- `handlePaymentSuccess(subscriptionId, paymentDetails)`
- `activateSubscription(subscriptionId)`

### 3. Automatic Renewal System

**Scheduler Job:** Runs daily at 2 AM
```typescript
@Cron('0 2 * * *')
async processRenewals() {
  const expiringSubscriptions = await this.findExpiringSubscriptions(7);
  
  for (const subscription of expiringSubscriptions) {
    await this.attemptRenewal(subscription);
  }
}
```

**Renewal Logic:**
1. Find subscriptions expiring in next 7 days
2. Attempt payment with saved payment method
3. On success: Extend end date, send confirmation
4. On failure: Schedule retry, send failure notification
5. After 3 failures: Mark as past_due, enter grace period


### 4. Payment Gateway Integration

**Unified Interface:**
```typescript
interface PaymentGatewayAdapter {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;
  createSubscription(params: SubscriptionParams): Promise<PaymentSubscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  processRefund(paymentId: string, amount: number): Promise<Refund>;
  verifyWebhook(payload: any, signature: string): boolean;
}
```

**Webhook Handling:**
```typescript
@Post('webhooks/:provider')
async handleWebhook(
  @Param('provider') provider: string,
  @Body() payload: any,
  @Headers('signature') signature: string
) {
  // Verify signature
  const isValid = await this.paymentService.verifyWebhook(
    provider,
    payload,
    signature
  );
  
  if (!isValid) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
  
  // Process event
  await this.paymentService.processWebhookEvent(provider, payload);
  
  return { received: true };
}
```

**Supported Events:**
- `payment.succeeded` → Activate subscription
- `payment.failed` → Mark payment failed, schedule retry
- `subscription.cancelled` → Update subscription status
- `subscription.updated` → Sync subscription details


### 5. Invoice Generation

**PDF Generation using PDFKit:**
```typescript
async generateInvoice(subscriptionId: string): Promise<Buffer> {
  const invoice = await this.getInvoiceData(subscriptionId);
  
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => Buffer.concat(chunks));
  
  // Header
  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.fontSize(10).text(`Invoice #${invoice.number}`);
  
  // Company details
  doc.text('WhatsApp CRM');
  doc.text('support@whatscrm.com');
  
  // Customer details
  doc.text(`Bill To: ${invoice.tenant.name}`);
  doc.text(invoice.tenant.email);
  
  // Line items
  doc.text(`${invoice.plan.name} Plan - ${invoice.billingCycle}`);
  doc.text(`Amount: $${invoice.amount}`);
  doc.text(`Tax: $${invoice.tax}`);
  doc.text(`Total: $${invoice.total}`);
  
  doc.end();
  
  return Buffer.concat(chunks);
}
```

**Invoice Storage:**
- Store invoice metadata in database
- Store PDF in S3 or local filesystem
- Generate download URLs with expiration


### 6. Email Notification System

**Email Templates:**
- `subscription-welcome.hbs` - Welcome email with getting started guide
- `payment-success.hbs` - Payment confirmation with invoice
- `payment-failed.hbs` - Payment failure with retry instructions
- `quota-warning.hbs` - Quota usage warning (80%, 90%, 95%)
- `renewal-reminder.hbs` - Upcoming renewal notification
- `subscription-cancelled.hbs` - Cancellation confirmation

**Email Service:**
```typescript
@Injectable()
export class EmailNotificationService {
  async sendSubscriptionWelcome(subscription: Subscription) {
    await this.mailer.send({
      to: subscription.tenant.email,
      subject: 'Welcome to WhatsApp CRM!',
      template: 'subscription-welcome',
      context: {
        tenantName: subscription.tenant.name,
        planName: subscription.plan.name,
        features: subscription.plan.features
      }
    });
  }
  
  async sendQuotaWarning(tenantId: string, resourceType: string, percentage: number) {
    const tenant = await this.getTenant(tenantId);
    
    await this.mailer.send({
      to: tenant.email,
      subject: `Quota Warning: ${resourceType} at ${percentage}%`,
      template: 'quota-warning',
      context: {
        resourceType,
        percentage,
        upgradeUrl: `${this.baseUrl}/subscription-plans`
      }
    });
  }
}
```


## Data Models

### Subscription Entity Updates

```typescript
@Entity('subscriptions')
export class Subscription {
  // ... existing fields ...
  
  @Column({ default: true })
  autoRenew: boolean;
  
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;
  
  @Column({ type: 'int', default: 0 })
  renewalAttempts: number;
  
  @Column({ type: 'timestamp', nullable: true })
  lastRenewalAttempt: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  gracePeriodEnd: Date;
  
  @Column({ nullable: true })
  cancellationReason: string;
  
  @Column({ type: 'jsonb', nullable: true })
  paymentMethod: {
    type: string; // 'card', 'paypal', 'upi'
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
}
```

### Invoice Entity

```typescript
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  subscriptionId: string;
  
  @Column()
  tenantId: string;
  
  @Column({ unique: true })
  invoiceNumber: string; // INV-2025-001234
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;
  
  @Column()
  currency: string; // USD, INR, EUR
  
  @Column({ type: 'enum', enum: ['draft', 'paid', 'failed', 'refunded'] })
  status: string;
  
  @Column({ type: 'timestamp' })
  issueDate: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;
  
  @Column({ nullable: true })
  pdfUrl: string;
  
  @Column({ type: 'jsonb' })
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}
```


## Error Handling

### Quota Exceeded Error

```typescript
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Contact quota limit exceeded",
  "details": {
    "resourceType": "contacts",
    "currentUsage": 2500,
    "limit": 2500,
    "upgradeUrl": "/subscription-plans"
  }
}
```

### Payment Failed Error

```typescript
{
  "statusCode": 402,
  "error": "Payment Required",
  "message": "Payment processing failed",
  "details": {
    "reason": "insufficient_funds",
    "retryable": true,
    "nextRetryAt": "2025-11-15T10:00:00Z"
  }
}
```

### Subscription Suspended Error

```typescript
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Subscription suspended due to payment failure",
  "details": {
    "suspendedAt": "2025-11-14T10:00:00Z",
    "reason": "payment_failed",
    "paymentUrl": "/billing/payment"
  }
}
```


## Testing Strategy

### Unit Tests

1. **Quota Enforcement Service**
   - Test quota check for each resource type
   - Test quota exceeded scenarios
   - Test quota calculation accuracy

2. **Subscription Lifecycle Service**
   - Test subscription creation flow
   - Test renewal logic with success/failure scenarios
   - Test cancellation flow
   - Test grace period handling

3. **Payment Gateway Adapters**
   - Mock payment gateway responses
   - Test webhook signature verification
   - Test event processing

### Integration Tests

1. **End-to-End Subscription Flow**
   - Create subscription → Payment → Activation
   - Test with each payment gateway
   - Verify database state at each step

2. **Quota Enforcement**
   - Create resources up to limit
   - Verify blocking at limit
   - Test after plan upgrade

3. **Renewal Process**
   - Mock time to trigger renewal
   - Test successful renewal
   - Test failed renewal with retries

### E2E Tests

1. **Complete User Journey**
   - Sign up → Select plan → Payment → Use features
   - Hit quota limit → Upgrade plan → Continue
   - Cancel subscription → Verify access ends

2. **Webhook Testing**
   - Use payment gateway test mode
   - Trigger various webhook events
   - Verify system responses


## Security Considerations

### Webhook Security

1. **Signature Verification**
   - Always verify webhook signatures before processing
   - Use constant-time comparison to prevent timing attacks
   - Reject webhooks with invalid signatures

2. **Idempotency**
   - Store processed webhook IDs to prevent duplicate processing
   - Use database transactions for webhook handling

### Payment Data Security

1. **PCI Compliance**
   - Never store full credit card numbers
   - Use payment gateway tokens for recurring payments
   - Store only last 4 digits for display

2. **Sensitive Data**
   - Encrypt payment method details at rest
   - Use HTTPS for all payment-related communications
   - Log payment events without sensitive data

### Access Control

1. **Subscription Management**
   - Only tenant admins can manage subscriptions
   - Verify tenant ownership before operations
   - Audit log all subscription changes

2. **Invoice Access**
   - Tenants can only access their own invoices
   - Generate time-limited download URLs
   - Require authentication for invoice downloads

