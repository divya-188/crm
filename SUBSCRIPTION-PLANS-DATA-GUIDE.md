# 📊 Subscription Plans Data Guide

## Overview

This guide explains the subscription plans data structure, where it comes from, and how it's used throughout the WhatsApp CRM system.

---

## 🗄️ Data Source

### 1. Database Schema

**Table:** `subscription_plans`

**Location:** `backend/src/modules/subscriptions/entities/subscription-plan.entity.ts`

```typescript
@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;                    // e.g., "Starter", "Professional", "Enterprise"

  @Column({ type: 'text', nullable: true })
  description: string;             // Plan description

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;                   // Monthly/yearly price

  @Column({ default: 'monthly' })
  billingCycle: string;            // 'monthly', 'quarterly', or 'annual'

  @Column({ type: 'jsonb' })
  features: PlanFeatures;          // Feature limits and permissions

  @Column({ default: true })
  isActive: boolean;               // Whether plan is available for signup

  @Column({ default: false })
  isPopular: boolean;              // Highlight as "Most Popular"

  @Column({ default: 0 })
  sortOrder: number;               // Display order

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Plan Features Structure

```typescript
interface PlanFeatures {
  // User & Contact Limits
  maxContacts: number;             // -1 = unlimited
  maxUsers: number;                // Team size limit
  
  // Campaign & Marketing
  maxCampaigns: number;            // Active campaigns
  maxTemplates: number;            // Message templates
  
  // Integration Limits
  maxApiKeys: number;              // API access keys
  maxWebhooks: number;             // Webhook endpoints
  whatsappConnections: number;     // WhatsApp Business accounts
  
  // Feature Flags
  hasAdvancedAnalytics: boolean;   // Advanced reporting
  hasCustomBranding: boolean;      // White-label features
  hasPrioritySupport: boolean;     // Priority customer support
  hasApiAccess: boolean;           // API access enabled
  hasAutomations: boolean;         // Workflow automations
  hasFlowBuilder: boolean;         // Visual flow builder
  hasTeamCollaboration: boolean;   // Multi-user features
  hasAdvancedSegmentation: boolean; // Contact segmentation
}
```

---

## 🔄 Data Flow

### 1. Data Creation

**Who creates it:** Super Admins  
**Where:** Super Admin Dashboard → Subscription Plans  
**How:** Through `PlanInlineForm` component

```typescript
// API Endpoint
POST /api/v1/subscription-plans

// Service Method
subscriptionPlansService.create(planData)
```

### 2. Data Storage

**Database:** PostgreSQL  
**Table:** `subscription_plans`  
**Seeded Data:** `backend/src/database/seeds/subscription-plans-seed.ts`

### 3. Data Retrieval

**API Endpoints:**
- `GET /api/v1/subscription-plans` - List all plans
- `GET /api/v1/subscription-plans/:id` - Get specific plan
- `GET /api/v1/subscription-plans/active` - Get active plans only

**Frontend Service:** `frontend/src/services/subscription-plans.service.ts`

```typescript
export const subscriptionPlansService = {
  getAll: async (includeInactive = false) => {
    const response = await apiClient.get('/subscription-plans', {
      params: { includeInactive }
    });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/subscription-plans/${id}`);
    return response.data;
  },
  
  create: async (data: CreatePlanDto) => {
    const response = await apiClient.post('/subscription-plans', data);
    return response.data;
  },
  
  update: async (id: string, data: UpdatePlanDto) => {
    const response = await apiClient.patch(`/subscription-plans/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    await apiClient.delete(`/subscription-plans/${id}`);
  }
};
```

---

## 🎯 Data Usage

### 1. Plan Management (Super Admin)

**Location:** `frontend/src/pages/super-admin/SubscriptionPlans.tsx`

**Purpose:**
- Create new subscription tiers
- Edit existing plans
- Set pricing and billing cycles
- Configure feature limits
- Enable/disable plans
- Compare plans side-by-side

**Key Features:**
- ✅ CRUD operations for plans
- ✅ Inline plan comparison with animations
- ✅ Feature matrix visualization
- ✅ Pricing management
- ✅ Popular plan highlighting
- ✅ Grid and list view modes
- ✅ Infinite scroll pagination
- ✅ Real-time search and filtering

### 2. Quota Enforcement

**Location:** `backend/src/modules/subscriptions/guards/quota.guard.ts`

**Purpose:**
- Enforce feature limits based on user's plan
- Block actions when limits are exceeded
- Provide upgrade prompts

**Example Usage:**
```typescript
@UseGuards(QuotaGuard)
@RequireFeature('maxContacts')
@Post('contacts')
async createContact() {
  // Only allowed if under contact limit
}
```

**Service:** `backend/src/modules/subscriptions/services/quota-enforcement.service.ts`

```typescript
export class QuotaEnforcementService {
  async checkQuota(tenantId: string, feature: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    const currentUsage = await this.getCurrentUsage(tenantId, feature);
    const limit = subscription.plan.features[feature];
    
    if (limit === -1) return true; // Unlimited
    return currentUsage < limit;
  }
  
  async enforceQuota(tenantId: string, feature: string): Promise<void> {
    const hasQuota = await this.checkQuota(tenantId, feature);
    if (!hasQuota) {
      throw new ForbiddenException(
        `You have reached the ${feature} limit for your plan. Please upgrade.`
      );
    }
  }
}
```

### 3. Billing & Subscriptions

**Location:** `backend/src/modules/subscriptions/services/subscription-lifecycle.service.ts`

**Purpose:**
- Process plan upgrades/downgrades
- Calculate billing amounts
- Handle plan changes
- Manage subscription lifecycle

**Key Operations:**
```typescript
// Upgrade to a new plan
await subscriptionLifecycleService.upgradePlan(
  tenantId,
  newPlanId,
  { prorated: true }
);

// Downgrade plan
await subscriptionLifecycleService.downgradePlan(
  tenantId,
  newPlanId,
  { effectiveDate: 'end_of_period' }
);

// Calculate prorated amount
const amount = await subscriptionLifecycleService.calculateProration(
  currentPlan,
  newPlan,
  daysRemaining
);
```

### 4. Feature Access Control

**Throughout the application:**

**Frontend:**
```typescript
// Check if user has feature access
const canUseAdvancedAnalytics = user.subscription?.plan?.features?.hasAdvancedAnalytics;

// Conditionally render features
{canUseAdvancedAnalytics && (
  <AdvancedAnalyticsComponent />
)}

// Show upgrade prompt
{!canUseApiAccess && (
  <UpgradePrompt feature="API Access" />
)}
```

**Backend:**
```typescript
// Service-level feature checks
if (!user.subscription.plan.features.hasApiAccess) {
  throw new ForbiddenException('API access not available in your plan');
}

// Middleware for feature gating
@UseGuards(FeatureGuard)
@RequireFeature('hasFlowBuilder')
@Get('flows')
async getFlows() {
  // Only accessible if plan has flow builder
}
```

### 5. Upgrade Prompts & Monetization

**Location:** Throughout the application

**Purpose:**
- Show upgrade prompts when limits are reached
- Display feature comparisons
- Guide users to higher-tier plans
- Drive revenue through upsells

**Example Scenarios:**
```typescript
// Contact limit reached
if (contactCount >= maxContacts) {
  showUpgradeModal({
    title: 'Contact Limit Reached',
    message: `You've reached your limit of ${maxContacts} contacts`,
    suggestedPlan: 'Professional',
    benefits: ['10,000 contacts', 'Advanced analytics', 'API access']
  });
}

// Feature not available
if (!hasAdvancedAnalytics) {
  showFeatureLockedBanner({
    feature: 'Advanced Analytics',
    availableIn: ['Professional', 'Enterprise'],
    ctaText: 'Upgrade Now'
  });
}
```

---

## 📊 Plan Comparison Implementation

### Old Implementation (Modal)

**File:** `frontend/src/components/subscription-plans/PlanComparisonModal.tsx`

**Issues:**
- ❌ Required modal popup
- ❌ Separate view from main page
- ❌ Less intuitive user experience
- ❌ No smooth animations
- ❌ Interrupts workflow

### New Implementation (Inline)

**File:** `frontend/src/pages/super-admin/SubscriptionPlans.tsx`

**Improvements:**
- ✅ Inline display with smooth animations
- ✅ Expandable/collapsible section
- ✅ Better visual hierarchy
- ✅ Animated feature comparison table
- ✅ Popular plan highlighting with gradient badge
- ✅ Responsive design with horizontal scroll
- ✅ No workflow interruption
- ✅ Staggered animations for visual appeal

**Animation Features:**
```typescript
// Smooth expand/collapse
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
transition={{ duration: 0.3, ease: 'easeInOut' }}

// Staggered table header animations
transition={{ delay: index * 0.1 }}

// Feature row animations
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: featureIndex * 0.05 }}

// Feature value animations
initial={{ opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: (featureIndex * 0.05) + (planIndex * 0.02) }}
```

**Visual Enhancements:**
1. **Popular Plan Badge** - Gradient background with star icon
2. **Feature Icons** - Check/X marks for boolean features
3. **Pricing Display** - Large, bold pricing with billing cycle
4. **Hover Effects** - Interactive row highlighting
5. **Responsive Table** - Horizontal scroll on mobile

---

## 🔧 Configuration

### Default Plans

**Location:** `backend/src/database/seeds/subscription-plans-seed.ts`

**Typical Structure:**

1. **Starter Plan** ($29/month)
   - 1,000 contacts
   - 2 users
   - 5 campaigns
   - Basic features
   - No API access

2. **Professional Plan** ($79/month) - Most Popular ⭐
   - 10,000 contacts
   - 10 users
   - 50 campaigns
   - Advanced analytics
   - API access
   - Priority support

3. **Enterprise Plan** ($199/month)
   - Unlimited contacts
   - Unlimited users
   - Unlimited campaigns
   - All features
   - Priority support
   - Custom branding
   - Dedicated account manager

### Environment Variables

```env
# Subscription settings
DEFAULT_PLAN_ID=starter-plan-uuid
FREE_TRIAL_DAYS=14
MAX_PLANS_PER_TENANT=1
ALLOW_PLAN_DOWNGRADES=true
PRORATION_ENABLED=true

# Payment gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

---

## 🎨 UI/UX Improvements

### Visual Enhancements

1. **Popular Plan Badge**
   - Gradient background (primary-500 to primary-700)
   - Star icon
   - Positioned above plan header
   - Animated entrance

2. **Feature Icons**
   - ✅ Check mark (success-500) for included features
   - ❌ X mark (neutral-300) for excluded features
   - 📊 Numbers with formatting for limits
   - "Unlimited" badge for -1 values

3. **Pricing Display**
   - Large, bold price (2xl font)
   - Billing cycle subtitle
   - "Best Value" indicator for popular plans
   - Animated pricing summary row

4. **Animations**
   - Smooth expand/collapse (300ms ease-in-out)
   - Staggered table row animations (50ms delay)
   - Hover effects on rows
   - Scale animations for feature values
   - Entrance animations for headers

### Responsive Design

- ✅ Horizontal scroll on mobile devices
- ✅ Collapsible sections
- ✅ Touch-friendly buttons
- ✅ Readable typography at all sizes
- ✅ Adaptive column widths
- ✅ Mobile-optimized spacing

---

## 🚀 Benefits of New Implementation

### For Super Admins

1. **Better Overview**
   - See all plans at once without modal
   - Quick feature comparison
   - Easy plan management
   - No context switching

2. **Improved Workflow**
   - No modal interruptions
   - Inline editing capabilities
   - Faster decision making
   - Seamless navigation

3. **Visual Appeal**
   - Modern animations
   - Professional appearance
   - Better data visualization
   - Engaging user experience

### For End Users (Future)

1. **Plan Selection**
   - Clear feature comparison
   - Visual pricing display
   - Popular plan highlighting
   - Easy-to-understand limits

2. **Upgrade Flow**
   - Smooth animations
   - Clear value proposition
   - Easy plan switching
   - Transparent pricing

---

## 📈 Usage Analytics

### Metrics to Track

1. **Plan Performance**
   - Most popular plans (conversion rate)
   - Average revenue per user (ARPU)
   - Upgrade patterns (which plans users upgrade to)
   - Downgrade reasons

2. **Feature Usage**
   - Which features drive upgrades
   - Limit hit frequency (quota enforcement triggers)
   - Feature adoption rates
   - Unused features per plan

3. **User Behavior**
   - Plan comparison views (how often users compare)
   - Time spent on pricing page
   - Upgrade funnel metrics
   - Abandonment points

4. **Revenue Metrics**
   - Monthly recurring revenue (MRR)
   - Annual recurring revenue (ARR)
   - Customer lifetime value (CLV)
   - Churn rate by plan

---

## 🔮 Future Enhancements

### Planned Features

1. **Dynamic Pricing**
   - Usage-based billing (pay per contact/message)
   - Custom enterprise pricing
   - Promotional pricing and discounts
   - Regional pricing variations

2. **Plan Recommendations**
   - AI-powered suggestions based on usage
   - Usage pattern analysis
   - Personalized upgrade prompts
   - Cost optimization recommendations

3. **Advanced Comparisons**
   - ROI calculators
   - Feature impact analysis
   - Cost-benefit visualization
   - Competitor comparison

4. **A/B Testing**
   - Pricing experiments
   - Feature bundling tests
   - Conversion optimization
   - UI/UX variations

5. **Add-ons & Extras**
   - Additional contact packs
   - Extra WhatsApp connections
   - Premium support tiers
   - One-time feature purchases

---

## 📝 Summary

**Data Source:** PostgreSQL database with seeded plans  
**Management:** Super Admin dashboard with CRUD operations  
**Usage:** Quota enforcement, billing, feature access control  
**Display:** Inline comparison with smooth animations  
**Purpose:** Revenue optimization and feature management

**Key Improvement:** Replaced modal-based comparison with inline, animated comparison table for better UX, visual appeal, and seamless workflow integration.

---

## 🔗 Related Files

### Backend
- `backend/src/modules/subscriptions/entities/subscription-plan.entity.ts` - Entity definition
- `backend/src/modules/subscriptions/subscription-plans.service.ts` - Business logic
- `backend/src/modules/subscriptions/subscription-plans.controller.ts` - API endpoints
- `backend/src/modules/subscriptions/services/quota-enforcement.service.ts` - Quota checks
- `backend/src/modules/subscriptions/services/subscription-lifecycle.service.ts` - Lifecycle management
- `backend/src/database/seeds/subscription-plans-seed.ts` - Default plans

### Frontend
- `frontend/src/pages/super-admin/SubscriptionPlans.tsx` - Main page with inline comparison
- `frontend/src/components/subscription-plans/PlanInlineForm.tsx` - Create/edit form
- `frontend/src/services/subscription-plans.service.ts` - API client
- `frontend/src/components/ui/Badge.tsx` - Badge component
- `frontend/src/components/ui/Card.tsx` - Card component

---

**Last Updated:** Now  
**Status:** ✅ Implemented with animations  
**Next:** Consider adding plan recommendation engine and A/B testing framework
