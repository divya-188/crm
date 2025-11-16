const fs = require('fs');
const path = require('path');

// Add logging to Razorpay webhook handler
const razorpayFile = path.join(__dirname, 'src/modules/subscriptions/services/razorpay-payment.service.ts');
let razorpayContent = fs.readFileSync(razorpayFile, 'utf8');

// Add logging to handleWebhook method
const webhookSearch = `  async handleWebhook(payload: any, signature: string): Promise<void> {`;
const webhookReplace = `  async handleWebhook(payload: any, signature: string): Promise<void> {
    console.log('\\n' + '='.repeat(100));
    console.log('🔔 [RAZORPAY-WEBHOOK] WEBHOOK RECEIVED');
    console.log('='.repeat(100));
    console.log(\`📦 [RAZORPAY-WEBHOOK] Event: \${payload.event}\`);
    console.log(\`📦 [RAZORPAY-WEBHOOK] Payload:\`, JSON.stringify(payload, null, 2));`;

if (razorpayContent.includes(webhookSearch)) {
  razorpayContent = razorpayContent.replace(webhookSearch, webhookReplace);
  fs.writeFileSync(razorpayFile, razorpayContent);
  console.log('✅ Added webhook logging to razorpay-payment.service.ts');
} else {
  console.log('⚠️  Webhook method not found in razorpay-payment.service.ts');
}

// Add logging to unified payment service activateSubscription
const unifiedFile = path.join(__dirname, 'src/modules/subscriptions/services/unified-payment.service.ts');
let unifiedContent = fs.readFileSync(unifiedFile, 'utf8');

// Add logging to activateSubscription method
const activateSearch = `  async activateSubscription(subscriptionId: string, tenantId: string): Promise<void> {`;
const activateReplace = `  async activateSubscription(subscriptionId: string, tenantId: string): Promise<void> {
    console.log('\\n' + '='.repeat(100));
    console.log('🎯 [UNIFIED-ACTIVATE] ACTIVATING SUBSCRIPTION');
    console.log('='.repeat(100));
    console.log(\`📋 Subscription ID: \${subscriptionId}\`);
    console.log(\`👤 Tenant ID: \${tenantId}\`);`;

if (unifiedContent.includes(activateSearch)) {
  unifiedContent = unifiedContent.replace(activateSearch, activateReplace);
  
  // Add logging when checking for upgrade intent
  const upgradeCheckSearch = `    // Check if this is an upgrade activation`;
  const upgradeCheckReplace = `    console.log(\`📦 [UNIFIED-ACTIVATE] Subscription metadata:\`, JSON.stringify(subscription.metadata, null, 2));
    console.log(\`🔍 [UNIFIED-ACTIVATE] Checking for upgrade intent...\`);
    
    // Check if this is an upgrade activation`;
  
  if (unifiedContent.includes(upgradeCheckSearch)) {
    unifiedContent = unifiedContent.replace(upgradeCheckSearch, upgradeCheckReplace);
  }
  
  // Add logging when creating invoice
  const invoiceSearch = `      // Create invoice for the prorated amount`;
  const invoiceReplace = `      console.log(\`📄 [UNIFIED-ACTIVATE] Creating invoice for upgrade...\`);
      console.log(\`💰 [UNIFIED-ACTIVATE] Prorated amount from metadata: $\${subscription.metadata.proratedAmount}\`);
      
      // Create invoice for the prorated amount`;
  
  if (unifiedContent.includes(invoiceSearch)) {
    unifiedContent = unifiedContent.replace(invoiceSearch, invoiceReplace);
  }
  
  fs.writeFileSync(unifiedFile, unifiedContent);
  console.log('✅ Added activation logging to unified-payment.service.ts');
} else {
  console.log('⚠️  activateSubscription method not found in unified-payment.service.ts');
}

console.log('\\n✅ Webhook and activation logging added successfully!');
