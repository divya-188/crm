# Subscription Lifecycle Management

This document describes the subscription lifecycle management system implemented for the WhatsApp CRM SaaS platform.

## Overview

The subscription lifecycle service handles all aspects of subscription management including:
- Creating subscriptions on successful payment
- Automatic subscription renewal
- Expiration handling with automated checks
- Upgrade and downgrade functionality
- Payment reminders
- Coupon code support

## Features

### 1. Subscription Creation on Payment

When a payment is successfully processed, a subscription is automatically created with:
- Start and end dates based on billing cycle
- Proper status tracking
- Tenant association and limit updates
- Metadata storage for additional information

**Endpoint:** `POST /api/v1/subscriptions`

### 2. Subscription Renewal

Subscriptions can be renewed manually or automatically through webhooks:
- Extends subscription period based on billing cycle
- Updates tenant subscription end date
- Maintains subscription continuity

**Endpoint:** `POST /api/v1/subscriptions/:id/renew`

### 3. Subscription Upgrade

Allows tenants to upgrade to a higher-tier plan:
- Validates that new plan is more expensive
- Calculates prorated amount for remaining period
- Immediately applies new plan features
- Updates tenant limits

**Endpoint:** `PATCH /api/v1/subscriptions/:id/upgrade`

**Request Body:**
```json
{
  "newPlanId": "uuid",
  "paymentProvider": "stripe",
  "paymentMethodId": "pm_xxx"
}
```

### 4. Subscription Downgrade

Schedules a downgrade to a lower-tier plan:
- Validates that new plan is less expensive
- Schedules downgrade for end of current period
- Prevents immediate service disruption
- Automatically applies at period end

**Endpoint:** `PATCH /api/v1/subscriptions/:id/downgrade`

**Request Body:**
```json
{
  "newPlanId": "uuid"
}
```

### 5. Coupon Code Support

Apply discount coupons to subscriptions:
- Validates coupon codes
- Supports percentage and fixed discounts
- Stores coupon information in subscription metadata

**Endpoint:** `POST /api/v1/subscriptions/:id/coupon`

**Request Body:**
```json
{
  "couponCode": "WELCOME10"
}
```

**Built-in Coupons:**
- `WELCOME10` - 10% discount
- `SAVE20` - 20% discount
- `FIRST50` - $50 fixed discount

### 6. Automated Expiration Handling

**Cron Schedule:** Daily at midnight

The system automatically:
- Identifies expired subscriptions
- Executes scheduled downgrades
- Marks subscriptions as expired
- Updates tenant status to expired
- Prevents access to expired accounts

### 7. Payment Reminders

**Cron Schedule:** Daily at 9 AM

Automated reminders are sent:
- 7 days before expiration
- 1 day before expiration
- On expiration day

Reminders are tracked in subscription metadata to prevent duplicates.

### 8. Past Due Handling

**Cron Schedule:** Daily at midnight

For subscriptions with failed payments:
- Tracks days past due
- Sends past due notifications
- Suspends tenant after 7 days past due
- Maintains payment failure history

## Subscription Statuses

- `active` - Subscription is active and valid
- `cancelled` - Subscription has been cancelled by user
- `expired` - Subscription period has ended
- `past_due` - Payment failed, awaiting resolution

## Tenant Status Updates

The lifecycle service automatically updates tenant status:
- `active` - Active subscription
- `expired` - Subscription expired
- `suspended` - Past due for 7+ days
- `trial` - Trial period (not managed by lifecycle service)

## Webhook Integration

The service integrates with payment provider webhooks:

### Stripe Events
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.payment_succeeded` - Restores past due subscriptions
- `invoice.payment_failed` - Marks subscription as past due

### PayPal Events
- Handled through unified webhook endpoint

### Razorpay Events
- `subscription.charged` - Confirms successful payment
- `subscription.cancelled` - Updates subscription status

## Prorated Calculations

When upgrading, the system calculates prorated amounts:

```typescript
const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
const remainingDays = (endDate - now) / (1000 * 60 * 60 * 24);
const currentPlanDailyRate = currentPlanPrice / totalDays;
const newPlanDailyRate = newPlanPrice / totalDays;
const proratedAmount = (newPlanDailyRate - currentPlanDailyRate) * remainingDays;
```

## Email Notifications

The service logs email notifications (integration with email service required):

### Reminder Emails
- Subject: "Your subscription expires in X days"
- Includes renewal link and plan details

### Past Due Emails
- Subject: "Payment failed - Action required"
- Includes payment update link

### Suspension Warnings
- Subject: "Account will be suspended"
- Sent before suspension occurs

## Testing

Use the provided test script to verify all lifecycle operations:

```bash
./test-subscription-lifecycle.sh
```

The script tests:
1. User registration and authentication
2. Subscription creation
3. Coupon application
4. Subscription upgrade
5. Subscription downgrade
6. Subscription renewal
7. Status synchronization
8. Subscription cancellation

## Configuration

### Environment Variables

```env
# Payment Provider Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYPAL_WEBHOOK_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Cron Job Configuration (optional)
ENABLE_SUBSCRIPTION_CRONS=true
```

### Cron Job Schedules

Modify cron schedules in `subscription-lifecycle.service.ts`:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleExpiredSubscriptions() { ... }

@Cron(CronExpression.EVERY_DAY_AT_9AM)
async sendPaymentReminders() { ... }

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handlePastDueSubscriptions() { ... }
```

## Database Schema

### Subscription Entity

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  paypal_subscription_id VARCHAR(255),
  razorpay_subscription_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Metadata Structure

```json
{
  "couponCode": "WELCOME10",
  "discountType": "percentage",
  "discountValue": 10,
  "appliedAt": "2024-01-01T00:00:00Z",
  "previousPlanId": "uuid",
  "upgradedAt": "2024-01-01T00:00:00Z",
  "scheduledDowngradePlanId": "uuid",
  "scheduledDowngradeAt": "2024-02-01T00:00:00Z",
  "lastReminderSent": "2024-01-25T09:00:00Z",
  "lastReminderDays": 7,
  "lastPastDueNotification": "2024-02-05T00:00:00Z",
  "daysPastDue": 3
}
```

## Error Handling

The service includes comprehensive error handling:

- Invalid plan IDs return 400 Bad Request
- Missing subscriptions return 404 Not Found
- Payment failures are logged and tracked
- Webhook signature validation prevents fraud
- Cron job errors are logged but don't stop execution

## Monitoring

Monitor subscription lifecycle health:

### Metrics to Track
- Active subscriptions count
- Expired subscriptions per day
- Past due subscriptions count
- Upgrade/downgrade frequency
- Coupon usage statistics
- Payment failure rate

### Logs to Monitor
- Subscription creation/renewal
- Upgrade/downgrade operations
- Expiration handling
- Payment reminder delivery
- Webhook processing
- Cron job execution

## Future Enhancements

Potential improvements:
1. Email service integration (SendGrid, AWS SES)
2. SMS notifications for critical events
3. Advanced coupon management with database
4. Grace period configuration
5. Dunning management for failed payments
6. Subscription pause/resume functionality
7. Multi-currency support
8. Tax calculation integration
9. Usage-based billing
10. Subscription analytics dashboard

## API Reference

### Create Subscription
`POST /api/v1/subscriptions`

### Renew Subscription
`POST /api/v1/subscriptions/:id/renew`

### Upgrade Subscription
`PATCH /api/v1/subscriptions/:id/upgrade`

### Downgrade Subscription
`PATCH /api/v1/subscriptions/:id/downgrade`

### Apply Coupon
`POST /api/v1/subscriptions/:id/coupon`

### Cancel Subscription
`DELETE /api/v1/subscriptions/:id`

### Sync Subscription Status
`GET /api/v1/subscriptions/:id/sync`

### Get Tenant Subscription
`GET /api/v1/subscriptions/tenant/:tenantId`

## Support

For issues or questions:
1. Check application logs
2. Verify webhook configuration
3. Test with provided script
4. Review subscription metadata
5. Check cron job execution logs
