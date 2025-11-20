const fs = require('fs');
const path = require('path');

// File 1: subscription-lifecycle.service.ts - Add logging to upgradeSubscription
const lifecycleFile = path.join(__dirname, 'src/modules/subscriptions/services/subscription-lifecycle.service.ts');
let lifecycleContent = fs.readFileSync(lifecycleFile, 'utf8');

// Add logging after prorated amount calculation
const proratedLogSearch = `    this.logger.log(\`💰 [UPGRADE] Prorated charge for remaining period: \$\${proratedAmount.toFixed(2)}\`);
    this.logger.log(\`💳 [UPGRADE] Payment provider: \${provider}\`);`;

const proratedLogReplace = `    this.logger.log(\`💰 [UPGRADE] Prorated charge for remaining period: \$\${proratedAmount.toFixed(2)}\`);
    this.logger.log(\`💳 [UPGRADE] Payment provider: \${provider}\`);
    console.log('\\n' + '='.repeat(100));
    console.log('🔄 [UPGRADE-LIFECYCLE] UPGRADE INITIATED');
    console.log('='.repeat(100));
    console.log(\`📋 Subscription ID: \${subscriptionId}\`);
    console.log(\`👤 Tenant ID: \${subscription.tenantId}\`);
    console.log(\`📊 Current Plan: \${subscription.plan.name} (ID: \${subscription.planId})\`);
    console.log(\`💵 Current Plan Price: $\${subscription.plan.price}\`);
    console.log(\`📊 New Plan: \${newPlan.name} (ID: \${newPlanId})\`);
    console.log(\`💵 New Plan Price: $\${newPlan.price}\`);
    console.log(\`💰 CALCULATED PRORATED AMOUNT: $\${proratedAmount.toFixed(2)}\`);
    console.log(\`💳 Payment Provider: \${provider}\`);
    console.log('='.repeat(100) + '\\n');`;

lifecycleContent = lifecycleContent.replace(proratedLogSearch, proratedLogReplace);

// Add logging before processOneTimePayment call
const paymentCallSearch = `        const paymentResult = await this.paymentService.processOneTimePayment(
          subscription.tenantId,
          proratedAmount,
          provider,
          customerEmail,
          paymentMethodId,
          {`;

const paymentCallReplace = `        console.log(\`📧 [UPGRADE-PAYMENT] Creating payment for \${customerEmail}\`);
        console.log(\`💰 [UPGRADE-PAYMENT] Amount: $\${proratedAmount.toFixed(2)}\`);
        console.log(\`📦 [UPGRADE-PAYMENT] Metadata:\`, JSON.stringify({
          description: \`Upgrade: \${subscription.plan.name} → \${newPlan.name} (prorated)\`,
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          newPlanId: newPlanId,
          oldPlanId: subscription.planId,
          type: 'upgrade_proration',
          isProrated: true,
          proratedAmount,
        }, null, 2));
        const paymentResult = await this.paymentService.processOneTimePayment(
          subscription.tenantId,
          proratedAmount,
          provider,
          customerEmail,
          paymentMethodId,
          {`;

lifecycleContent = lifecycleContent.replace(paymentCallSearch, paymentCallReplace);

// Add logging after checkout URL is created
const checkoutLogSearch = `        this.logger.log(\`✅ [UPGRADE] Payment link created: \${checkoutUrl}\`);`;
const checkoutLogReplace = `        this.logger.log(\`✅ [UPGRADE] Payment link created: \${checkoutUrl}\`);
        console.log(\`✅ [UPGRADE-PAYMENT] Payment link created successfully\`);
        console.log(\`🔗 [UPGRADE-PAYMENT] Checkout URL: \${checkoutUrl}\`);`;

lifecycleContent = lifecycleContent.replace(checkoutLogSearch, checkoutLogReplace);

// Add logging when saving metadata
const metadataLogSearch = `    await this.subscriptionRepository.save(subscription);

    this.logger.log(\`✅ [UPGRADE] Upgrade initiated. Waiting for payment confirmation.\`);`;

const metadataLogReplace = `    console.log(\`💾 [UPGRADE-METADATA] Saving subscription metadata:\`);
    console.log(JSON.stringify(subscription.metadata, null, 2));
    await this.subscriptionRepository.save(subscription);

    this.logger.log(\`✅ [UPGRADE] Upgrade initiated. Waiting for payment confirmation.\`);
    console.log(\`✅ [UPGRADE-COMPLETE] Upgrade initiated. Waiting for payment confirmation.\`);
    console.log('='.repeat(100) + '\\n');`;

lifecycleContent = lifecycleContent.replace(metadataLogSearch, metadataLogReplace);

fs.writeFileSync(lifecycleFile, lifecycleContent);
console.log('✅ Added logging to subscription-lifecycle.service.ts');

// File 2: invoice.service.ts - Add logging to createInvoiceForSubscription
const invoiceFile = path.join(__dirname, 'src/modules/subscriptions/services/invoice.service.ts');
let invoiceContent = fs.readFileSync(invoiceFile, 'utf8');

// Add logging at the start of createInvoiceForSubscription
const invoiceStartSearch = `  async createInvoiceForSubscription(
    subscriptionId: string,
    paymentMethod: string,
  ): Promise<Invoice> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = subscription.plan;
    const tenant = subscription.tenant;
    
    // Check if this is a prorated charge (upgrade/downgrade)
    // Use prorated amount from metadata if available, otherwise use plan price
    let amount = Number(plan.price);
    let description = \`\${plan.name} - \${plan.billingCycle} subscription\`;
    
    if (subscription.metadata?.proratedAmount && subscription.metadata?.upgradeIntent) {
      // This is an upgrade with prorated charge
      amount = Number(subscription.metadata.proratedAmount);
      description = \`\${plan.name} - Prorated upgrade charge\`;
      this.logger.log(\`Using prorated amount \${amount} for upgrade invoice\`);
    }`;

const invoiceStartReplace = `  async createInvoiceForSubscription(
    subscriptionId: string,
    paymentMethod: string,
  ): Promise<Invoice> {
    console.log('\\n' + '='.repeat(100));
    console.log('📄 [INVOICE-CREATE] CREATING INVOICE');
    console.log('='.repeat(100));
    console.log(\`📋 Subscription ID: \${subscriptionId}\`);
    console.log(\`💳 Payment Method: \${paymentMethod}\`);
    
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = subscription.plan;
    const tenant = subscription.tenant;
    
    console.log(\`📊 Plan: \${plan.name} (ID: \${plan.id})\`);
    console.log(\`💵 Plan Price: $\${plan.price}\`);
    console.log(\`📦 Subscription Metadata:\`, JSON.stringify(subscription.metadata, null, 2));
    
    // Check if this is a prorated charge (upgrade/downgrade)
    // Use prorated amount from metadata if available, otherwise use plan price
    let amount = Number(plan.price);
    let description = \`\${plan.name} - \${plan.billingCycle} subscription\`;
    
    console.log(\`🔍 [INVOICE-AMOUNT] Checking for prorated amount...\`);
    console.log(\`🔍 [INVOICE-AMOUNT] metadata.proratedAmount: \${subscription.metadata?.proratedAmount}\`);
    console.log(\`🔍 [INVOICE-AMOUNT] metadata.upgradeIntent: \${JSON.stringify(subscription.metadata?.upgradeIntent)}\`);
    
    if (subscription.metadata?.proratedAmount && subscription.metadata?.upgradeIntent) {
      // This is an upgrade with prorated charge
      amount = Number(subscription.metadata.proratedAmount);
      description = \`\${plan.name} - Prorated upgrade charge\`;
      console.log(\`✅ [INVOICE-AMOUNT] Using PRORATED amount: $\${amount}\`);
      this.logger.log(\`Using prorated amount \${amount} for upgrade invoice\`);
    } else {
      console.log(\`⚠️ [INVOICE-AMOUNT] Using FULL PLAN price: $\${amount}\`);
    }`;

invoiceContent = invoiceContent.replace(invoiceStartSearch, invoiceStartReplace);

// Add logging before creating invoice record
const invoiceRecordSearch = `    const tax = amount * 0.0; // No tax for now, can be configured
    const total = amount + tax;

    // Create invoice record
    const invoice = this.invoiceRepository.create({`;

const invoiceRecordReplace = `    const tax = amount * 0.0; // No tax for now, can be configured
    const total = amount + tax;

    console.log(\`💰 [INVOICE-FINAL] Final invoice amount: $\${amount}\`);
    console.log(\`💰 [INVOICE-FINAL] Tax: $\${tax}\`);
    console.log(\`💰 [INVOICE-FINAL] Total: $\${total}\`);
    console.log(\`📝 [INVOICE-FINAL] Description: \${description}\`);

    // Create invoice record
    const invoice = this.invoiceRepository.create({`;

invoiceContent = invoiceContent.replace(invoiceRecordSearch, invoiceRecordReplace);

// Add logging after invoice is saved
const invoiceSaveSearch = `    this.logger.log(\`Invoice \${savedInvoice.invoiceNumber} created for subscription \${subscriptionId}\`);

    return savedInvoice;`;

const invoiceSaveReplace = `    this.logger.log(\`Invoice \${savedInvoice.invoiceNumber} created for subscription \${subscriptionId}\`);
    console.log(\`✅ [INVOICE-SAVED] Invoice created: \${savedInvoice.invoiceNumber}\`);
    console.log(\`💰 [INVOICE-SAVED] Invoice amount: $\${savedInvoice.amount}\`);
    console.log(\`💰 [INVOICE-SAVED] Invoice total: $\${savedInvoice.total}\`);
    console.log('='.repeat(100) + '\\n');

    return savedInvoice;`;

invoiceContent = invoiceContent.replace(invoiceSaveSearch, invoiceSaveReplace);

fs.writeFileSync(invoiceFile, invoiceContent);
console.log('✅ Added logging to invoice.service.ts');

// File 3: razorpay-payment.service.ts - Add logging to activateSubscription
const razorpayFile = path.join(__dirname, 'src/modules/subscriptions/services/razorpay-payment.service.ts');
if (fs.existsSync(razorpayFile)) {
  let razorpayContent = fs.readFileSync(razorpayFile, 'utf8');
  
  // Add logging at start of activateSubscription
  const activateSearch = `  async activateSubscription(subscriptionId: string, tenantId: string): Promise<void> {`;
  const activateReplace = `  async activateSubscription(subscriptionId: string, tenantId: string): Promise<void> {
    console.log('\\n' + '='.repeat(100));
    console.log('🎯 [RAZORPAY-ACTIVATE] ACTIVATING SUBSCRIPTION');
    console.log('='.repeat(100));
    console.log(\`📋 Subscription ID: \${subscriptionId}\`);
    console.log(\`👤 Tenant ID: \${tenantId}\`);`;
  
  razorpayContent = razorpayContent.replace(activateSearch, activateReplace);
  
  fs.writeFileSync(razorpayFile, razorpayContent);
  console.log('✅ Added logging to razorpay-payment.service.ts');
}

console.log('\\n✅ All logging added successfully!');
console.log('\\nNow restart your backend server to see the logs.');
