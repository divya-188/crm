# 🎭 Complete Roles & Permissions Guide - WhatsApp CRM SaaS

## 📊 Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    🔴 SUPER_ADMIN                        │
│              (Platform Owner - You)                      │
│         Manages entire multi-tenant platform             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     🟢 ADMIN                             │
│              (Tenant Owner/Business Owner)               │
│         Manages their own company/tenant                 │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     🟡 AGENT                             │
│           (Customer Service Representative)              │
│         Handles customer conversations                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     🔵 USER                              │
│                (End Customer/Basic User)                 │
│              Limited dashboard access                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔴 SUPER_ADMIN (Platform Owner)

### 👤 Who is this?
**YOU** - The person who owns and operates the entire WhatsApp CRM SaaS platform.

### 🎯 Purpose
Manage the entire multi-tenant platform, oversee all businesses using your platform, handle billing, and monitor platform health.

### 💼 Real-World Example
Think of yourself as the owner of Shopify, Salesforce, or HubSpot. You provide the platform, and businesses (tenants) sign up to use it.

### 🔑 What Can They Do?

#### Platform Management
- ✅ View ALL tenants (businesses) using your platform
- ✅ Create new tenant accounts
- ✅ Suspend/activate/delete tenant accounts
- ✅ Impersonate any tenant admin for support
- ✅ View platform-wide analytics

#### Subscription & Billing
- ✅ Create/edit/delete subscription plans
- ✅ Set pricing for different tiers (Basic, Pro, Enterprise)
- ✅ View revenue analytics
- ✅ Track subscription status across all tenants

#### User Management
- ✅ View ALL users across ALL tenants
- ✅ Filter users by tenant, role, status
- ✅ Manage any user account

#### System Administration
- ✅ Monitor platform health
- ✅ View system-wide statistics
- ✅ Access all features for testing

### 🌐 Frontend Routes
```
/super-admin/dashboard       → Platform overview
/super-admin/tenants         → All tenant management
/super-admin/plans           → Subscription plans
/super-admin/users           → Cross-tenant user management
/super-admin/analytics       → Platform analytics
```

### 🛡️ Backend Permissions
```typescript
@Roles(UserRole.SUPER_ADMIN)  // Super admin only endpoints
```

### ⚠️ Important Notes
- **NO tenantId**: Super admins don't belong to any tenant
- **Full Access**: Can access everything across all tenants
- **Support Role**: Can impersonate admins to help with issues

---

## 🟢 ADMIN (Tenant Owner / Business Owner)

### 👤 Who is this?
A **business owner** who signs up for your platform to use the WhatsApp CRM for their company.

### 🎯 Purpose
Run their own WhatsApp CRM business, manage their team, handle customer relationships, and grow their business.

### 💼 Real-World Example
- Owner of "ABC E-commerce" using your platform
- Manager of "XYZ Real Estate Agency"
- CEO of "Restaurant Chain Inc."

### 🔑 What Can They Do?

#### Tenant Management
- ✅ Manage their OWN tenant/company settings
- ✅ Update business profile
- ✅ Customize branding (logo, colors)
- ✅ Configure business settings
- ❌ Cannot access other tenants

#### Team Management
- ✅ Create/edit/delete users within their tenant
- ✅ Hire agents (customer service reps)
- ✅ Assign roles to team members
- ✅ Monitor team performance

#### Business Operations
- ✅ Manage customer contacts
- ✅ Handle WhatsApp conversations
- ✅ Create marketing campaigns
- ✅ Build message templates
- ✅ Set up automations
- ✅ Create conversation flows
- ✅ Manage WhatsApp connections
- ✅ Configure API keys
- ✅ Set up webhooks

#### Analytics & Reporting
- ✅ View business analytics
- ✅ Monitor agent performance
- ✅ Track campaign results
- ✅ Analyze customer interactions

#### Subscription
- ✅ View available subscription plans
- ✅ Manage their subscription
- ❌ Cannot create/edit plans (only super admin can)

### 🌐 Frontend Routes
```
/admin/dashboard             → Business overview
/admin/users                 → Team management
/admin/contacts              → Customer database
/admin/plans                 → View subscription options
/admin/analytics             → Business analytics
/admin/settings              → Tenant configuration
```

### 🛡️ Backend Permissions
```typescript
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // Admin + Super admin
```

### ⚠️ Important Notes
- **HAS tenantId**: Belongs to a specific tenant
- **Tenant Isolation**: Can only see their own tenant's data
- **Business Owner**: Full control over their business
- **Subscription Required**: Must have active subscription

---

## 🟡 AGENT (Customer Service Representative)

### 👤 Who is this?
An **employee** hired by the ADMIN to handle customer service and support.

### 🎯 Purpose
Handle day-to-day customer interactions, respond to WhatsApp messages, manage contacts, and execute marketing campaigns.

### 💼 Real-World Example
- Customer service rep at "ABC E-commerce"
- Support agent at "XYZ Real Estate"
- Sales representative at "Restaurant Chain"

### 🔑 What Can They Do?

#### Customer Interactions
- ✅ Handle WhatsApp conversations
- ✅ Respond to customer messages
- ✅ View conversation history
- ✅ Assign conversations to themselves

#### Contact Management
- ✅ View customer contacts
- ✅ Edit contact information
- ✅ Segment contacts
- ✅ Add notes to contacts

#### Marketing Operations
- ✅ Create and send campaigns
- ✅ Use message templates
- ✅ Execute automations
- ✅ Use conversation flows

#### Integrations
- ✅ Manage WhatsApp connections
- ✅ Create API keys (for their tenant)
- ✅ Set up webhooks

#### Personal Analytics
- ✅ View their own performance metrics
- ✅ Track their conversations
- ✅ Monitor their response times

### 🌐 Frontend Routes
```
/agent/dashboard             → Agent overview
/agent/inbox                 → Customer conversations
/agent/contacts              → Customer database
/agent/campaigns             → Marketing campaigns
/agent/templates             → Message templates
/agent/automations           → Business automations
/agent/flows                 → Conversation flows
/agent/whatsapp              → WhatsApp connections
/agent/api-keys              → Integration keys
/agent/webhooks              → Webhook management
/agent/analytics/*           → Performance analytics
/agent/settings              → Personal settings
```

### 🛡️ Backend Permissions
```typescript
// Most endpoints are accessible to authenticated users
// No specific @Roles decorator needed
```

### ⚠️ Important Notes
- **HAS tenantId**: Belongs to a specific tenant
- **Limited Management**: Cannot create/delete users
- **Operational Focus**: Focused on customer interactions
- **No Billing Access**: Cannot view/manage subscriptions

### ❌ What They CANNOT Do
- ❌ Create or manage other users
- ❌ Change tenant settings
- ❌ View subscription/billing information
- ❌ Access other tenants' data
- ❌ Modify business configuration

---

## 🔵 USER (End Customer / Basic User)

### 👤 Who is this?
An **end customer** or basic user with minimal access.

### 🎯 Purpose
Basic user access - this role is minimally implemented and mainly serves as a default role.

### 💼 Real-World Example
- A customer who has an account
- A basic user with limited features
- Default role for new signups

### 🔑 What Can They Do?
- ✅ Basic dashboard access
- ✅ View their own profile
- ✅ Update personal settings

### 🌐 Frontend Routes
```
/dashboard                   → Basic user dashboard
/settings                    → Personal settings
```

### ⚠️ Important Notes
- **Minimal Implementation**: This role is not fully developed
- **Default Role**: Often assigned by default
- **Limited Features**: Very restricted access
- **Future Expansion**: May be expanded for customer portals

---

## 🔐 Permission Matrix

| Feature | Super Admin | Admin | Agent | User |
|---------|:-----------:|:-----:|:-----:|:----:|
| **Platform Management** |
| View All Tenants | ✅ | ❌ | ❌ | ❌ |
| Create/Delete Tenants | ✅ | ❌ | ❌ | ❌ |
| Impersonate Users | ✅ | ❌ | ❌ | ❌ |
| Platform Analytics | ✅ | ❌ | ❌ | ❌ |
| **Subscription Management** |
| Create/Edit Plans | ✅ | ❌ | ❌ | ❌ |
| View Plans | ✅ | ✅ | ❌ | ❌ |
| Manage Own Subscription | ✅ | ✅ | ❌ | ❌ |
| **Tenant Management** |
| Manage Own Tenant | ✅ | ✅ | ❌ | ❌ |
| Tenant Settings | ✅ | ✅ | ❌ | ❌ |
| Branding/Customization | ✅ | ✅ | ❌ | ❌ |
| **User Management** |
| Cross-Tenant Users | ✅ | ❌ | ❌ | ❌ |
| Tenant Users | ✅ | ✅ | ❌ | ❌ |
| Create/Delete Users | ✅ | ✅ | ❌ | ❌ |
| **CRM Features** |
| Manage Contacts | ✅ | ✅ | ✅ | ❌ |
| Handle Conversations | ✅ | ✅ | ✅ | ❌ |
| Create Campaigns | ✅ | ✅ | ✅ | ❌ |
| Use Templates | ✅ | ✅ | ✅ | ❌ |
| Build Automations | ✅ | ✅ | ✅ | ❌ |
| Create Flows | ✅ | ✅ | ✅ | ❌ |
| **Integrations** |
| WhatsApp Connections | ✅ | ✅ | ✅ | ❌ |
| API Keys | ✅ | ✅ | ✅ | ❌ |
| Webhooks | ✅ | ✅ | ✅ | ❌ |
| **Analytics** |
| Platform Analytics | ✅ | ❌ | ❌ | ❌ |
| Business Analytics | ✅ | ✅ | ❌ | ❌ |
| Agent Performance | ✅ | ✅ | ✅ | ❌ |
| Personal Metrics | ✅ | ✅ | ✅ | ❌ |

---

## 🏗️ Technical Implementation

### Database Structure
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  role VARCHAR DEFAULT 'user',  -- 'super_admin', 'admin', 'agent', 'user'
  tenantId UUID,                -- NULL for super_admin
  ...
);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR,
  slug VARCHAR UNIQUE,
  status VARCHAR,
  ...
);
```

### Backend Role Guards
```typescript
// Super admin only
@Roles(UserRole.SUPER_ADMIN)

// Admin or super admin
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)

// Agent, admin, or super admin
@Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)

// All authenticated users (no decorator needed)
```

### Frontend Route Protection
```typescript
// Super admin routes
<RoleBasedRoute allowedRoles={['super_admin']}>

// Admin routes
<RoleBasedRoute allowedRoles={['admin']}>

// Agent routes
<RoleBasedRoute allowedRoles={['agent']}>

// User routes
<RoleBasedRoute allowedRoles={['user']}>
```

---

## 🎯 Business Use Cases

### Scenario 1: E-commerce Company
```
Super Admin (You)
    ↓
Admin (ABC E-commerce Owner)
    ↓
Agent 1 (Sales Rep)
Agent 2 (Support Rep)
Agent 3 (Customer Success)
```

### Scenario 2: Real Estate Agency
```
Super Admin (You)
    ↓
Admin (XYZ Real Estate Manager)
    ↓
Agent 1 (Property Agent)
Agent 2 (Leasing Agent)
```

### Scenario 3: Restaurant Chain
```
Super Admin (You)
    ↓
Admin (Restaurant Chain CEO)
    ↓
Agent 1 (Location 1 Manager)
Agent 2 (Location 2 Manager)
Agent 3 (Customer Service)
```

---

## 🔄 Role Relationships

### Hierarchical Access
- **Super Admin** → Can access everything
- **Admin** → Can access their tenant + all agent features
- **Agent** → Can access operational features only
- **User** → Minimal access

### Tenant Isolation
- Each tenant is **completely isolated**
- Users can only access their own tenant's data
- Super admin can **cross tenant boundaries**
- Admins manage **their own tenant only**

### Permission Inheritance
- Higher roles inherit lower role permissions
- Super admin has all admin permissions
- Admin has all agent permissions
- Agent has all user permissions

---

## ❓ Common Questions

### Q: Is there a separate "Tenant" role?
**A:** No! The **ADMIN role IS the tenant owner**. There's no separate tenant role.

### Q: Can an Admin see other tenants?
**A:** No! Admins can only see and manage their own tenant. Only Super Admin can see all tenants.

### Q: Can an Agent create users?
**A:** No! Only Admin and Super Admin can create/manage users.

### Q: What's the difference between Admin and Super Admin?
**A:** 
- **Super Admin** = Platform owner (you), manages all tenants
- **Admin** = Business owner, manages their own tenant

### Q: Can I have multiple Super Admins?
**A:** Yes, but typically there's only one (you). You can create more if needed for your team.

### Q: How do businesses sign up?
**A:** When someone registers, they become an **Admin** and a new **Tenant** is created for them.

---

## 📝 Summary

Your WhatsApp CRM implements a **4-tier role-based access control (RBAC)** system:

1. **SUPER_ADMIN** 🔴 - Platform owner (you) managing the entire SaaS
2. **ADMIN** 🟢 - Business owners managing their company
3. **AGENT** 🟡 - Customer service reps handling conversations
4. **USER** 🔵 - End customers with basic access

The system ensures **complete tenant isolation** while providing **hierarchical permissions** and **role-based feature access** across the platform.

**Key Concept**: This is a **multi-tenant SaaS platform** where:
- You (super_admin) provide the platform
- Businesses (admin) sign up and pay for subscriptions
- Businesses hire agents to handle customer service
- Each business is completely isolated from others


---

## 🚨 SECURITY CONCERNS & FIXES

### Critical Issues Identified

Your role system is solid, but there are **7 security gaps** that need addressing:

1. **🔴 CRITICAL: Agents have too much power**
   - Currently agents can create API keys, webhooks, and manage WhatsApp connections
   - This is a data breach waiting to happen
   - **Fix:** Restrict these to Admin only (see `SECURITY-FIXES-CHECKLIST.md`)

2. **🔴 CRITICAL: Admins can delete other admins**
   - Creates "office politics in the database"
   - No protection against accidental deletion
   - **Fix:** Prevent same-level admin deletion

3. **🔴 HIGH: No audit trail for impersonation**
   - Super admin can impersonate without logging
   - Compliance nightmare (GDPR, HIPAA, SOC 2)
   - **Fix:** Add audit logging system

4. **🟡 MEDIUM: Tenant creation not transactional**
   - Risk of orphaned tenants or users
   - **Fix:** Wrap in database transaction

5. **🟡 MEDIUM: No inbox permission modes**
   - All agents see all conversations
   - Privacy concerns
   - **Fix:** Add inbox modes (shared/assigned/private)

6. **🟢 LOW: No rate limiting**
   - Vulnerable to brute force attacks
   - **Fix:** Add @nestjs/throttler

7. **🟢 LOW: No password policy**
   - Users can set weak passwords
   - **Fix:** Add password strength validation

### Quick Fixes (Do These First)

**Phase 1: Critical (4 hours)**
- Add role guards to API keys, webhooks, WhatsApp
- Prevent admin-to-admin deletion
- **Risk Reduction: 80%**

**Phase 2: High Priority (8 hours)**
- Add audit logging
- Add transaction wrapping
- Add rate limiting
- **Risk Reduction: 15%**

**Phase 3: Nice to Have (12 hours)**
- Implement inbox permissions
- Add password policy
- Add 2FA
- **Risk Reduction: 5%**

### Implementation Guide

See detailed implementation steps in:
- `SECURITY-AUDIT-AND-IMPROVEMENTS.md` - Full analysis
- `SECURITY-FIXES-CHECKLIST.md` - Step-by-step fixes

---

## 🎓 Learning Resources

### Understanding Multi-Tenant SaaS
- [AWS Multi-Tenant SaaS Guide](https://aws.amazon.com/partners/programs/saas/)
- [Stripe's Multi-Tenant Architecture](https://stripe.com/docs/connect)

### Role-Based Access Control (RBAC)
- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)

### Security Best Practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

## 🤝 Contributing

Found an issue or have a suggestion? Please:
1. Review the security audit first
2. Check if it's already documented
3. Create a detailed issue with examples
4. Consider the business impact

---

## 📄 License & Usage

This documentation is part of your WhatsApp CRM SaaS project. Use it to:
- Onboard new developers
- Explain the system to stakeholders
- Guide security reviews
- Plan feature development

**Last Updated:** November 2024
**Version:** 1.0
**Status:** ⚠️ Security fixes needed before production
