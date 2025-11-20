import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SettingsCacheService } from '../../../common/services/settings-cache.service';
import { SettingsAuditService } from '../../../common/services/settings-audit.service';

export interface BillingInfo {
  companyName?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingEmail?: string;
}

export interface PaymentMethod {
  type: 'card' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

@Injectable()
export class BillingSettingsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    private subscriptionsService: SubscriptionsService,
    private cacheService: SettingsCacheService,
    private auditService: SettingsAuditService,
  ) {}

  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(tenantId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }
    return subscription;
  }

  async getUsageStatistics(tenantId: string) {
    const subscription = await this.getCurrentSubscription(tenantId);
    // TODO: Implement proper usage tracking
    return {
      conversations: {
        used: 0,
        limit: 1000,
        percentage: 0,
      },
      users: {
        used: 0,
        limit: 10,
        percentage: 0,
      },
      whatsappNumbers: {
        used: 0,
        limit: 5,
        percentage: 0,
      },
    };
  }

  async getBillingInfo(tenantId: string): Promise<BillingInfo> {
    const cacheKey = `billing:${tenantId}`;
    const cached = await this.cacheService.get<BillingInfo>(cacheKey);
    if (cached) return cached;

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const billingInfo = (tenant.integrationSettings as any)?.billing || {};
    await this.cacheService.set(cacheKey, billingInfo);
    return billingInfo;
  }

  async updateBillingInfo(
    tenantId: string,
    billingInfo: BillingInfo,
    userId: string,
  ): Promise<BillingInfo> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const integrationSettings = (tenant.integrationSettings as any) || {};
    integrationSettings.billing = billingInfo;

    tenant.integrationSettings = integrationSettings;
    await this.tenantsRepository.save(tenant);

    // Invalidate cache
    const cacheKey = `billing:${tenantId}`;
    await this.cacheService.invalidate(cacheKey);

    // Audit log
    await this.auditService.log({
      userId,
      tenantId,
      settingsType: 'billing',
      action: 'update',
      changes: billingInfo,
    });

    return billingInfo;
  }

  async changePlan(
    tenantId: string,
    newPlanId: string,
    userId: string,
  ) {
    const subscription = await this.getCurrentSubscription(tenantId);
    
    if (subscription.plan.id === newPlanId) {
      throw new BadRequestException('Already subscribed to this plan');
    }

    // TODO: Implement plan change through subscriptions service
    // const result = await this.subscriptionsService.changePlan(subscription.id, newPlanId);
    
    // Audit log
    await this.auditService.log({
      userId,
      tenantId,
      settingsType: 'billing',
      action: 'update',
      changes: { oldPlanId: subscription.plan.id, newPlanId },
    });

    return { message: 'Plan change initiated', subscriptionId: subscription.id, newPlanId };
  }

  async cancelSubscription(
    tenantId: string,
    reason: string,
    userId: string,
  ) {
    const subscription = await this.getCurrentSubscription(tenantId);

    // TODO: Implement cancellation through subscriptions service
    // const result = await this.subscriptionsService.cancelSubscription(subscription.id, reason);
    
    // Audit log
    await this.auditService.log({
      userId,
      tenantId,
      settingsType: 'billing',
      action: 'update',
      changes: { reason, action: 'cancel' },
    });

    return { message: 'Subscription cancellation initiated', subscriptionId: subscription.id, reason };
  }

  async getBillingHistory(tenantId: string, limit: number = 10) {
    // TODO: Implement invoice history retrieval
    // return this.subscriptionsService.getInvoiceHistory(tenantId, limit);
    return [];
  }

  async getPaymentMethod(tenantId: string): Promise<PaymentMethod | null> {
    const subscription = await this.getCurrentSubscription(tenantId);
    
    // Get payment method from payment provider
    if (subscription.paymentMethod) {
      return subscription.paymentMethod as PaymentMethod;
    }

    return null;
  }

  async updatePaymentMethod(
    tenantId: string,
    paymentMethodId: string,
    userId: string,
  ) {
    const subscription = await this.getCurrentSubscription(tenantId);

    // TODO: Implement payment method update through subscriptions service
    // const result = await this.subscriptionsService.updatePaymentMethod(subscription.id, paymentMethodId);
    
    // Audit log
    await this.auditService.log({
      userId,
      tenantId,
      settingsType: 'billing',
      action: 'update',
      changes: { paymentMethodId },
    });

    return { message: 'Payment method update initiated', subscriptionId: subscription.id, paymentMethodId };
  }
}
