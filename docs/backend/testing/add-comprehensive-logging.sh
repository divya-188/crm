#!/bin/bash

# Add comprehensive logging to track invoice amounts throughout the upgrade flow

echo "Adding comprehensive logging to subscription lifecycle service..."

cat > backend/src/modules/subscriptions/services/subscription-lifecycle-with-logs.ts << 'EOF'
// This file contains the enhanced logging version
// Copy the upgradeSubscription method with comprehensive logging

async upgradeSubscription(
  subscriptionId: string,
  newPlanId: string,
  provider: PaymentProvider,
  paymentMethodId?: string,
): Promise<Subscription> {
  const subscription = await this.subscriptionRepository.findOne({
    where: { id: subscriptionId },
    relations: ['plan', 'tenant'],
  });

  if (!subscription) {
    throw new BadRequestException('Subscription not found');
  }

  const newPlan = await this.planRepository.findOne({
    where: { id: newPlanId },
  });

  if (!newPlan) {
    throw new BadRequestException('New plan not found');
  }

  // Validate upgrade (new plan should be more expensive)
  if (Number(newPlan.price) <= Number(subscription.plan.price)) {
    throw new BadRequestException(
      'New plan must be more expensive than current plan for upgrade',
    );
  }

  // Calculate prorated amount (only the difference for remaining days)
  const proratedAmount = this.calculateProratedAmount(
    subscription,
    newPlan,
  );

  console.log('\n' + '='.repeat(100));
  console.log('🔄 [UPGRADE-START] SUBSCRIPTION UPGRADE INITIATED');
  console.log('='.repeat(100));
  console.log(`📋 Subscription ID: ${subscriptionId}`);
  console.log(`👤 Tenant ID: ${subscription.tenantId}`);
  console.log(`📊 Current Plan: ${subscription.plan.name} (ID: ${subscription.planId})`);
  console.log(`💵 Current Plan Price: $${subscription.plan.price}`);
  console.log(`📊 New Plan: ${newPlan.name} (ID: ${newPlanId})`);
  console.log(`💵 New Plan Price: $${newPlan.price}`);
  console.log(`💰 CALCULATED PRORATED AMOUNT: $${proratedAmount.toFixed(2)}`);
  console.log(`💳 Payment Provider: ${provider}`);
  console.log(`📅 Current Period: ${subscription.startDate} to ${subscription.endDate}`);
  console.log('='.repeat(100) + '\n');

  this.logger.log(`🔄 [UPGRADE] Subscription ${subscriptionId}: ${subscription.plan.name} → ${newPlan.name}`);
  this.logger.log(`💰 [UPGRADE] PRORATED AMOUNT: $${proratedAmount.toFixed(2)}`);

  // Process prorated payment if amount > 0
  let checkoutUrl: string | undefined;
  if (proratedAmount > 0) {
    try {
      // Get tenant email for payment link
      const tenant = await this.dataSource.query(
        'SELECT email FROM users WHERE "tenantId" = $1 LIMIT 1',
        [subscription.tenantId],
      );
      const customerEmail = tenant[0]?.email || 'customer@example.com';
      
      console.log(`📧 [UPGRADE-PAYMENT] Creating payment link for ${customerEmail}`);
      console.log(`💰 [UPGRADE-PAYMENT] Amount to charge: $${proratedAmount.toFixed(2)}`);

      const paymentMetadata = {
        description: `Upgrade: ${subscription.plan.name} → ${newPlan.name} (prorated)`,
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        newPlanId: newPlanId,
        oldPlanId: subscription.planId,
        type: 'upgrade_proration',
        isProrated: true,
        proratedAmount,
      };

      console.log(`📦 [UPGRADE-PAYMENT] Payment metadata:`, JSON.stringify(paymentMetadata, null, 2));

      const paymentResult = await this.paymentService.processOneTimePayment(
        subscription.tenantId,
        proratedAmount,
        provider,
        customerEmail,
        paymentMethodId,
        paymentMetadata,
      );
      
      checkoutUrl = paymentResult.checkoutUrl;

      console.log(`✅ [UPGRADE-PAYMENT] Payment link created successfully`);
      console.log(`🔗 [UPGRADE-PAYMENT] Checkout URL: ${checkoutUrl}`);
    } catch (error) {
      console.error(`❌ [UPGRADE-PAYMENT] Failed to create payment link:`, error.message);
      console.error(`❌ [UPGRADE-PAYMENT] Error stack:`, error.stack);
      throw new BadRequestException(
        `Failed to create payment link: ${error.message}`,
      );
    }
  } else {
    console.log(`⚠️ [UPGRADE-PAYMENT] No payment needed (prorated amount is $0)`);
  }

  const previousPlanId = subscription.planId;

  // Store upgrade intent (plan will be updated after payment confirmation)
  const upgradeMetadata = {
    ...subscription.metadata,
    previousPlanId,
    upgradeIntent: {
      newPlanId,
      proratedAmount,
      initiatedAt: new Date().toISOString(),
      status: 'pending_payment',
      invoiceCreated: false,
    },
    checkoutUrl,
    proratedAmount,
  };

  console.log(`💾 [UPGRADE-METADATA] Saving subscription metadata:`);
  console.log(JSON.stringify(upgradeMetadata, null, 2));

  subscription.metadata = upgradeMetadata;
  await this.subscriptionRepository.save(subscription);

  console.log(`✅ [UPGRADE-COMPLETE] Upgrade initiated successfully`);
  console.log(`⏳ [UPGRADE-COMPLETE] Waiting for payment confirmation via webhook`);
  console.log('='.repeat(100) + '\n');

  return subscription;
}
EOF

echo "✅ Logging template created"
echo ""
echo "Now adding logging to unified payment service..."
