# Subscription System Architecture

## Overview

The subscription system is a multi-tenant SaaS architecture that controls access and enforces quotas across all modules. It connects Super Admins, Tenants (Admins), and their features through a hierarchical permission and quota system.

## Role Hierarchy

```
┌─────────────────┐
│  Super Admin    │  Platform Owner - Manages everything
└────────┬────────┘
         │
         ├─── Manages Subscription Plans
         ├─── Manages All Tenants
         └─── Platform-wide Settings
              │
              ▼
┌─────────────────┐
│  Tenant/Admin   │  Organization Owner - Manages their tenant
└────────┬────────┘
         │
         ├─── Subscribes to a Plan
         ├─── Manages Users (Agents)
         ├─── Manages Contacts
         └─── Uses Features (within quota limits)
              │
              ▼
┌─────────────────┐
│  Agent/User     │  Team Member - Uses features
└─────────────────┘
         │
         └─── Works within tenant's subscription limits
```

## Database Schema Relationships

```
subscription_plans (managed by super_admin)
    ├── id
    ├── name (Starter, Growth, Professional, Enterprise)
    ├── price
    ├── billingCycle (monthly, quarterly, annual)
    └── features (JSON)
        ├── maxContacts: 2500
        ├── maxUsers: 3
        ├── maxConversations: 1000
        ├── maxCampaigns: 10
        ├── maxFlows: 5
        ├── maxAutomations: 15
        ├── whatsappConnections: 1
        ├── customBranding: false
        ├── prioritySupport: false
        └── apiAccess: false

                ↓ (tenant subscribes to)

subscriptions (links tenant to plan)
    ├── id
    ├── tenantId → tenants.id
    ├── planId → subscription_plans.id
    ├── status (active, cancelled, expired, past_due)
    ├── currentPeriodStart
    ├── currentPeriodEnd
    └── autoRenew

                ↓ (tenant owns)

tenants (organizations)
    ├── id
    ├── name
    ├── domain
    ├── settings (JSON)
    └── subscription → subscriptions

                ↓ (tenant has many)

users (agents/admins within tenant)
    ├── id
    ├── tenantId → tenants.id
    ├── role (admin, agent)
    ├── email
    └── name

                ↓ (users create/manage)

contacts, conversations, campaigns, flows, automations, whatsapp_connections
    └── All scoped to tenantId
```

## How It Works

### 1. Super Admin Workflow

**Super Admin manages the platform:**

```typescript
// Super Admin creates subscription plans
POST /api/super-admin/subscription-plans
{
  "name": "Starter",
  "price": 49.00,
  "billingCycle": "monthly",
  "features": {
    "maxContacts": 2500,
    "maxUsers": 3,
    "maxConversations": 1000,
    "maxCampaigns": 10,
    "maxFlows": 5,
    "maxAutomations": 15,
    "whatsappConnections": 1,
    "customBranding": false,
    "prioritySupport": false,
    "apiAccess": false
  }
}

// Super Admin can view all tenants
GET /api/super-admin/tenants

// Super Admin can manage any tenant's subscription
POST /api/super-admin/tenants/{tenantId}/subscription
{
  "planId": "plan-uuid",
  "billingCycle": "monthly"
}
```

**Access Control:**
- Only users with `role: 'super_admin'` can access `/super-admin/*` routes
- Super Admin is NOT tied to any tenant (tenantId is null)
- Has full platform access

### 2. Tenant/Admin Workflow

**When a new organization signs up:**

```typescript
// 1. Registration creates tenant + admin user + default subscription
POST /api/auth/register
{
  "email": "admin@company.com",
  "password": "secure123",
  "tenantName": "Acme Corp",
  "domain": "acme"
}

// Backend automatically:
// - Creates tenant record
// - Creates admin user (role: 'admin', tenantId: tenant.id)
// - Creates subscription (with trial or default plan)
// - Returns JWT with tenantId embedded
```

**Admin manages their organization:**

```typescript
// Admin views available plans (to upgrade/downgrade)
GET /api/subscription-plans
// Returns only active plans

// Admin subscribes to a plan
POST /api/subscriptions
{
  "planId": "plan-uuid",
  "paymentMethodId": "pm_xxx" // Stripe/PayPal token
}

// Admin views their current subscription
GET /api/subscriptions/current
// Returns: plan details, usage stats, renewal date

// Admin manages users within their tenant
POST /api/users
{
  "email": "agent@company.com",
  "role": "agent",
  "name": "John Doe"
}
// Automatically scoped to admin's tenantId
```

**Access Control:**
- Admin can only see/manage data within their tenantId
- Middleware automatically filters all queries by tenantId
- Cannot access other tenants' data

### 3. Quota Enforcement

**Every feature-creating action is checked against subscription limits:**

```typescript
// Example: Creating a contact
POST /api/contacts
{
  "name": "Jane Doe",
  "phone": "+1234567890"
}

// Backend flow:
@UseGuards(QuotaGuard) // ← Checks quota before allowing
async createContact(@Body() dto, @CurrentUser() user) {
  // 1. Get tenant's subscription
  const subscription = await this.subscriptionService
    .findByTenantId(user.tenantId);
  
  // 2. Get plan features
  const plan = subscription.plan;
  const maxContacts = plan.features.maxContacts;
  
  // 3. Count current usage
  const currentCount = await this.contactsService
    .countByTenant(user.tenantId);
  
  // 4. Check if limit reached
  if (currentCount >= maxContacts) {
    throw new ForbiddenException(
      `Contact limit reached (${maxContacts}). Upgrade your plan.`
    );
  }
  
  // 5. Allow creation
  return this.contactsService.create(dto, user.tenantId);
}
```

**Quota Guard Implementation:**

```typescript
// backend/src/modules/subscriptions/guards/quota.guard.ts
@Injectable()
export class QuotaGuard implements CanActivate {
  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceType = this.getResourceType(context);
    
    // Get tenant's subscription
    const subscription = await this.subscriptionService
      .findByTenantId(user.tenantId);
    
    // Check if feature is allowed
    const isAllowed = await this.quotaService
      .checkQuota(user.tenantId, resourceType);
    
    if (!isAllowed) {
      throw new ForbiddenException(
        `${resourceType} limit reached. Upgrade your plan.`
      );
    }
    
    return true;
  }
}
```

### 4. Module Integration

**Each module enforces quotas:**

```typescript
// Contacts Module
@Controller('contacts')
export class ContactsController {
  @Post()
  @UseGuards(JwtAuthGuard, QuotaGuard)
  @CheckQuota('contacts') // ← Decorator specifies resource type
  async create(@Body() dto, @CurrentUser() user) {
    // Quota already checked by guard
    return this.contactsService.create(dto, user.tenantId);
  }
}

// Campaigns Module
@Controller('campaigns')
export class CampaignsController {
  @Post()
  @UseGuards(JwtAuthGuard, QuotaGuard)
  @CheckQuota('campaigns')
  async create(@Body() dto, @CurrentUser() user) {
    return this.campaignsService.create(dto, user.tenantId);
  }
}

// WhatsApp Connections Module
@Controller('whatsapp')
export class WhatsAppController {
  @Post('connections')
  @UseGuards(JwtAuthGuard, QuotaGuard)
  @CheckQuota('whatsappConnections')
  async createConnection(@Body() dto, @CurrentUser() user) {
    return this.whatsappService.createConnection(dto, user.tenantId);
  }
}
```

### 5. Feature Flags

**Boolean features control access to entire modules:**

```typescript
// API Access Check
@Controller('api-keys')
export class ApiKeysController {
  @Post()
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature('apiAccess') // ← Checks if plan includes this feature
  async create(@Body() dto, @CurrentUser() user) {
    return this.apiKeysService.create(dto, user.tenantId);
  }
}

// Feature Guard Implementation
@Injectable()
export class FeatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredFeature = this.getRequiredFeature(context);
    
    const subscription = await this.subscriptionService
      .findByTenantId(user.tenantId);
    
    const hasFeature = subscription.plan.features[requiredFeature];
    
    if (!hasFeature) {
      throw new ForbiddenException(
        `This feature requires ${requiredFeature}. Upgrade your plan.`
      );
    }
    
    return true;
  }
}
```

## Frontend Integration

### 1. Displaying Subscription Info

```typescript
// Dashboard shows current usage vs limits
const Dashboard = () => {
  const { data: subscription } = useQuery(['subscription'], 
    () => subscriptionService.getCurrent()
  );
  
  const { data: usage } = useQuery(['usage'], 
    () => subscriptionService.getUsage()
  );
  
  return (
    <div>
      <h2>Your Plan: {subscription.plan.name}</h2>
      
      <UsageCard
        label="Contacts"
        current={usage.contacts}
        max={subscription.plan.features.maxContacts}
      />
      
      <UsageCard
        label="Users"
        current={usage.users}
        max={subscription.plan.features.maxUsers}
      />
      
      {usage.contacts >= subscription.plan.features.maxContacts && (
        <Alert variant="warning">
          Contact limit reached. 
          <Button onClick={() => navigate('/upgrade')}>
            Upgrade Plan
          </Button>
        </Alert>
      )}
    </div>
  );
};
```

### 2. Conditional Feature Rendering

```typescript
// Only show features if plan includes them
const Sidebar = () => {
  const { data: subscription } = useQuery(['subscription'], 
    () => subscriptionService.getCurrent()
  );
  
  const features = subscription?.plan?.features || {};
  
  return (
    <nav>
      <NavItem to="/contacts">Contacts</NavItem>
      <NavItem to="/campaigns">Campaigns</NavItem>
      <NavItem to="/flows">Flows</NavItem>
      
      {features.apiAccess && (
        <NavItem to="/api-keys">API Keys</NavItem>
      )}
      
      {features.customBranding && (
        <NavItem to="/settings/branding">Branding</NavItem>
      )}
    </nav>
  );
};
```

### 3. Upgrade Prompts

```typescript
// Show upgrade prompt when limit reached
const CreateContactButton = () => {
  const { data: usage } = useQuery(['usage'], 
    () => subscriptionService.getUsage()
  );
  
  const { data: subscription } = useQuery(['subscription'], 
    () => subscriptionService.getCurrent()
  );
  
  const limitReached = usage.contacts >= 
    subscription.plan.features.maxContacts;
  
  if (limitReached) {
    return (
      <Button onClick={() => navigate('/upgrade')} variant="warning">
        Upgrade to Add More Contacts
      </Button>
    );
  }
  
  return (
    <Button onClick={() => setShowCreateModal(true)}>
      Create Contact
    </Button>
  );
};
```

## Subscription Lifecycle

### 1. Trial Period

```typescript
// New tenant gets 14-day trial
const subscription = await this.subscriptionService.create({
  tenantId: tenant.id,
  planId: trialPlan.id,
  status: 'trialing',
  trialEnd: addDays(new Date(), 14),
  currentPeriodStart: new Date(),
  currentPeriodEnd: addDays(new Date(), 14)
});
```

### 2. Active Subscription

```typescript
// Tenant subscribes and pays
const subscription = await this.subscriptionService.subscribe({
  tenantId: user.tenantId,
  planId: selectedPlan.id,
  paymentMethodId: 'pm_xxx'
});

// Status: 'active'
// Features: Unlocked based on plan
```

### 3. Renewal

```typescript
// Automatic renewal (cron job runs daily)
@Cron('0 0 * * *') // Every day at midnight
async handleSubscriptionRenewals() {
  const expiring = await this.subscriptionService
    .findExpiringSoon();
  
  for (const subscription of expiring) {
    if (subscription.autoRenew) {
      await this.paymentService.charge(subscription);
      await this.subscriptionService.renew(subscription.id);
    } else {
      await this.subscriptionService.expire(subscription.id);
    }
  }
}
```

### 4. Cancellation

```typescript
// Tenant cancels subscription
await this.subscriptionService.cancel(subscription.id);

// Status: 'cancelled'
// Access: Continues until period end, then downgraded to free/trial
```

### 5. Upgrade/Downgrade

```typescript
// Tenant upgrades plan
await this.subscriptionService.changePlan({
  subscriptionId: subscription.id,
  newPlanId: professionalPlan.id
});

// Prorated billing
// Immediate feature access
```

## Payment Integration

```typescript
// Stripe Integration
@Injectable()
export class StripePaymentService {
  async createSubscription(dto: CreateSubscriptionDto) {
    // 1. Create Stripe customer
    const customer = await this.stripe.customers.create({
      email: dto.email,
      metadata: { tenantId: dto.tenantId }
    });
    
    // 2. Attach payment method
    await this.stripe.paymentMethods.attach(dto.paymentMethodId, {
      customer: customer.id
    });
    
    // 3. Create Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: dto.priceId }],
      metadata: { tenantId: dto.tenantId }
    });
    
    // 4. Create local subscription record
    return this.subscriptionService.create({
      tenantId: dto.tenantId,
      planId: dto.planId,
      stripeSubscriptionId: stripeSubscription.id,
      status: 'active'
    });
  }
  
  // Webhook handler for payment events
  @Post('webhooks/stripe')
  async handleWebhook(@Body() event) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.subscriptionService.markPaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.subscriptionService.markFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.subscriptionService.cancel(event.data.object);
        break;
    }
  }
}
```

## Summary

**The subscription system connects everything:**

1. **Super Admin** creates and manages subscription plans
2. **Tenants** subscribe to plans and get quota limits
3. **All modules** enforce quotas through guards
4. **Users** work within their tenant's subscription limits
5. **Frontend** shows usage and prompts upgrades
6. **Payment system** handles billing and renewals

This creates a complete SaaS platform where every feature is controlled by the subscription tier!
