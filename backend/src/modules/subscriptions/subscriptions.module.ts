import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { QuotaGuard } from './guards/quota.guard';
import { QuotaEnforcementService } from './services/quota-enforcement.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { PayPalPaymentService } from './services/paypal-payment.service';
import { RazorpayPaymentService } from './services/razorpay-payment.service';
import { UnifiedPaymentService } from './services/unified-payment.service';
import { InvoiceService } from './services/invoice.service';
import { SubscriptionLifecycleService } from './services/subscription-lifecycle.service';
import { RenewalSchedulerService } from './services/renewal-scheduler.service';
import { EmailNotificationService } from './services/email-notification.service';
import { QuotaResetService } from './services/quota-reset.service';
import { Contact } from '../contacts/entities/contact.entity';
import { User } from '../users/entities/user.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Flow } from '../flows/entities/flow.entity';
import { Automation } from '../automations/entities/automation.entity';
import { WhatsAppConnection } from '../whatsapp/entities/whatsapp-connection.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      Subscription,
      Invoice,
      Contact,
      User,
      Conversation,
      Campaign,
      Flow,
      Automation,
      WhatsAppConnection,
      Tenant,
    ]),
  ],
  controllers: [SubscriptionPlansController, SubscriptionsController],
  providers: [
    SubscriptionPlansService,
    SubscriptionsService,
    QuotaGuard,
    QuotaEnforcementService,
    StripePaymentService,
    PayPalPaymentService,
    RazorpayPaymentService,
    UnifiedPaymentService,
    InvoiceService,
    SubscriptionLifecycleService,
    RenewalSchedulerService,
    EmailNotificationService,
    QuotaResetService,
  ],
  exports: [
    SubscriptionPlansService,
    SubscriptionsService,
    QuotaGuard,
    QuotaEnforcementService,
    UnifiedPaymentService,
    InvoiceService,
    SubscriptionLifecycleService,
    RenewalSchedulerService,
    EmailNotificationService,
  ],
})
export class SubscriptionsModule {}
