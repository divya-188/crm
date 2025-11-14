# Subscription Lifecycle Implementation Plan

- [x] 1. Implement Quota Enforcement System
  - Create QuotaGuard that intercepts resource creation requests
  - Add @QuotaResource decorator to specify resource type
  - Implement quota checking logic in QuotaEnforcementService
  - Return 403 error with upgrade URL when quota exceeded
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Create quota guard decorator and metadata
  - Write @QuotaResource() decorator to mark endpoints
  - Create metadata key for resource type identification
  - _Requirements: 1.1_

- [x] 1.2 Implement QuotaGuard canActivate logic
  - Extract tenant ID and resource type from request
  - Call QuotaEnforcementService to check quota
  - Throw ForbiddenException with details if exceeded
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.3 Apply quota guards to resource controllers
  - Add QuotaGuard to contacts POST endpoint
  - Add QuotaGuard to users POST endpoint
  - Add QuotaGuard to WhatsApp connections POST endpoint
  - Add QuotaGuard to campaigns, flows, automations POST endpoints
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_


- [x] 2. Implement Subscription Creation with Payment
  - Add createSubscription endpoint to controller
  - Implement subscription creation flow in service
  - Integrate with payment gateway for checkout
  - Handle payment success webhook
  - Activate subscription on successful payment
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Create subscription creation endpoint
  - Add POST /subscriptions endpoint
  - Accept planId and paymentProvider in request
  - Validate plan exists and is active
  - _Requirements: 2.1_

- [x] 2.2 Implement payment gateway checkout flow
  - Create checkout session with selected gateway
  - Store pending subscription in database
  - Return checkout URL to frontend
  - _Requirements: 2.2_

- [x] 2.3 Handle payment success webhook
  - Verify webhook signature
  - Update subscription status to 'active'
  - Set subscription dates (start, end)
  - Create invoice record
  - _Requirements: 2.3_

- [x] 2.4 Write integration tests for subscription creation
  - Test with mock payment gateway
  - Verify subscription activation
  - Test webhook handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 3. Implement Automatic Subscription Renewal
  - Create scheduler service for renewal processing
  - Implement renewal attempt logic
  - Handle renewal success and failure
  - Implement retry mechanism for failed renewals
  - Send email notifications for renewal events
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Create renewal scheduler job
  - Add @Cron decorator for daily execution
  - Query subscriptions expiring in next 7 days
  - Process each subscription for renewal
  - _Requirements: 3.1_

- [x] 3.2 Implement renewal payment processing
  - Charge saved payment method
  - On success: extend subscription end date
  - On failure: increment renewal attempts, schedule retry
  - _Requirements: 3.2, 3.3_

- [x] 3.3 Implement renewal retry logic
  - Retry after 24 hours on failure
  - Mark as past_due after 3 failed attempts
  - Enter grace period after max retries
  - _Requirements: 3.4_

- [x] 3.4 Add renewal email notifications
  - Send success email with new end date
  - Send failure email with retry information
  - Send past_due warning email
  - _Requirements: 3.5_


- [x] 4. Implement Subscription Cancellation
  - Add cancellation endpoint to controller
  - Implement cancellation logic in service
  - Cancel payment gateway subscription
  - Send cancellation confirmation email
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 Create cancellation endpoint
  - Add DELETE /subscriptions/:id endpoint
  - Accept optional cancellation reason
  - Verify user has permission to cancel
  - _Requirements: 4.1_

- [x] 4.2 Implement immediate vs end-of-period cancellation
  - Mark subscription for cancellation at period end
  - Continue service until current period ends
  - Update status to 'cancelled' at period end
  - _Requirements: 4.2, 4.3_

- [x] 4.3 Cancel payment gateway subscription
  - Call payment gateway API to cancel recurring billing
  - Handle cancellation for each gateway (Stripe/PayPal/Razorpay)
  - _Requirements: 4.4_

- [x] 4.4 Send cancellation confirmation
  - Email with cancellation details
  - Include service end date
  - Provide reactivation option
  - _Requirements: 4.5_


- [x] 5. Implement Invoice Generation
  - Create invoice entity and migration
  - Implement PDF generation with PDFKit
  - Add invoice download endpoint
  - Generate invoices on successful payments
  - Send invoice emails
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.1 Create invoice database schema
  - Add invoice entity with all required fields
  - Create migration for invoices table
  - Add relationship to subscriptions
  - _Requirements: 6.1, 6.4_

- [x] 5.2 Implement PDF invoice generation
  - Install and configure PDFKit
  - Create invoice template with company/customer details
  - Add line items, subtotal, tax, total
  - Generate professional-looking PDF
  - _Requirements: 6.2, 6.3_

- [x] 5.3 Create invoice download endpoint
  - Add GET /invoices/:id/download endpoint
  - Verify user has access to invoice
  - Return PDF with proper headers
  - _Requirements: 6.3_

- [x] 5.4 Auto-generate invoices on payment
  - Create invoice record on successful payment
  - Generate PDF and store URL
  - Send invoice email with PDF attachment
  - _Requirements: 6.1, 6.5_


- [x] 6. Implement Plan Upgrades and Downgrades
  - Add upgrade/downgrade endpoints
  - Calculate prorated charges for upgrades
  - Validate downgrade against current usage
  - Schedule downgrades for period end
  - Send plan change confirmation emails
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6.1 Create upgrade endpoint
  - Add PATCH /subscriptions/:id/upgrade
  - Accept new plan ID
  - Apply change immediately
  - _Requirements: 7.1_

- [x] 6.2 Implement prorated charge calculation
  - Calculate remaining days in current period
  - Calculate prorated amount for new plan
  - Process prorated payment
  - _Requirements: 7.2_

- [x] 6.3 Create downgrade endpoint
  - Add PATCH /subscriptions/:id/downgrade
  - Validate current usage against new plan limits
  - Schedule change for period end
  - _Requirements: 7.3, 7.4_

- [x] 6.4 Send plan change notifications
  - Email for successful upgrade
  - Email for scheduled downgrade
  - Include new plan details and effective date
  - _Requirements: 7.5_


- [x] 7. Implement Email Notification System
  - Create email templates for all subscription events
  - Implement email service methods
  - Configure email provider (SendGrid/AWS SES)
  - Add quota warning emails
  - Add renewal reminder emails
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.1 Create email templates
  - subscription-welcome.hbs
  - payment-success.hbs
  - payment-failed.hbs
  - quota-warning.hbs
  - renewal-reminder.hbs
  - subscription-cancelled.hbs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.2 Implement email service methods
  - sendSubscriptionWelcome()
  - sendPaymentSuccess()
  - sendPaymentFailed()
  - sendQuotaWarning()
  - sendRenewalReminder()
  - sendCancellationConfirmation()
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.3 Add quota monitoring for email triggers
  - Check quota usage after resource creation
  - Send warning at 80%, 90%, 95%
  - Store last warning sent to avoid spam
  - _Requirements: 8.4_

- [x] 7.4 Implement renewal reminder scheduler
  - Send reminders at 7, 3, and 1 days before expiration
  - Track which reminders have been sent
  - _Requirements: 8.5_


- [x] 8. Implement Grace Period Management
  - Add grace period fields to subscription entity
  - Implement grace period activation on payment failure
  - Display warnings during grace period
  - Suspend subscription after grace period
  - Allow reactivation on successful payment
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8.1 Update subscription entity for grace period
  - Add gracePeriodEnd timestamp field
  - Add migration for new field
  - _Requirements: 9.1_

- [x] 8.2 Activate grace period on payment failure
  - Set gracePeriodEnd to 7 days from failure
  - Keep subscription status as 'past_due'
  - Continue allowing service access
  - _Requirements: 9.1, 9.2_

- [x] 8.3 Add grace period warning middleware
  - Check if subscription is in grace period
  - Add warning header to API responses
  - Display banner in frontend
  - _Requirements: 9.2_

- [x] 8.4 Implement subscription suspension
  - Create scheduler job to check expired grace periods
  - Update status to 'suspended'
  - Block all resource creation
  - _Requirements: 9.3, 9.4_

- [x] 8.5 Implement subscription reactivation
  - Add POST /subscriptions/:id/reactivate endpoint
  - Process payment for outstanding amount
  - Restore subscription to 'active' status
  - _Requirements: 9.5_


- [x] 9. Create E2E Tests for Subscription Lifecycle
  - Test complete subscription creation flow
  - Test quota enforcement blocking
  - Test renewal process
  - Test cancellation flow
  - Test plan upgrades and downgrades
  - _Requirements: All_

- [x] 9.1 Write quota enforcement E2E tests
  - Create resources up to quota limit
  - Verify blocking when limit reached
  - Test upgrade and continued creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9.2 Write subscription creation E2E tests
  - Test with mock payment gateway
  - Verify subscription activation
  - Check invoice generation
  - Verify welcome email sent
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9.3 Write renewal E2E tests
  - Mock time to trigger renewal
  - Test successful renewal
  - Test failed renewal with retries
  - Verify grace period activation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9.4 Write cancellation E2E tests
  - Test immediate cancellation
  - Test end-of-period cancellation
  - Verify payment gateway cancellation
  - Check confirmation email
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9.5 Write plan change E2E tests
  - Test upgrade with prorated charge
  - Test downgrade validation
  - Test scheduled downgrade execution
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
