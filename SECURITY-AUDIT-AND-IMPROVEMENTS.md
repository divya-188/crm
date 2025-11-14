# 🔒 Security Audit & Improvement Plan

## Executive Summary

Your role system is solid, but there are **7 critical security gaps** that need addressing before production. These aren't bugs—they're real-world attack vectors that will bite you.

---

## 🚨 Critical Issues Found

### 1️⃣ **CRITICAL: Agents Have Too Much Power**

**Current State:**
```typescript
// Agents can do ALL of these:
- Create/delete API keys
- Create/delete webhooks  
- Manage WhatsApp connections
```

**The Problem:**
- A disgruntled agent can create an API key and exfiltrate all customer data
- An agent can set up a webhook to their own server and steal conversations
- An agent can disconnect WhatsApp and take down the business

**Real-World Scenario:**
```
Day 1: Agent gets hired
Day 30: Agent creates API key "for testing"
Day 60: Agent quits, takes API key with them
Day 61: Agent uses API key to scrape all customer data
Day 62: You get sued for data breach
```


**Recommended Fix:**
```typescript
// API Keys Controller - Add role guard
@Post()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← ADMIN ONLY
async create(@Request() req, @Body() createApiKeyDto: CreateApiKeyDto) {
  // ...
}

// Webhooks Controller - Add role guard
@Post()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← ADMIN ONLY
async create(@Request() req, @Body() createWebhookDto: CreateWebhookDto) {
  // ...
}

// WhatsApp Controller - Add role guard
@Post('connections')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← ADMIN ONLY
create(@TenantId() tenantId: string, @Body() createConnectionDto: CreateConnectionDto) {
  // ...
}
```

**Impact:** 🔴 **HIGH** - Data breach risk
**Effort:** 🟢 **LOW** - 30 minutes to fix

---

### 2️⃣ **CRITICAL: Admin Can Delete Other Admins**

**Current State:**
```typescript
// Any admin can delete any user in their tenant
@Delete(':id')
async remove(@Param('id') id: string): Promise<void> {
  return this.usersService.remove(id);
}
```

**The Problem:**
- If you have 2 admins in a tenant, Admin A can delete Admin B
- This creates "office politics in the database"
- No protection against accidental deletion of the owner

**Real-World Scenario:**
```
Company has 2 co-founders, both admins
Founder A gets mad at Founder B
Founder A deletes Founder B's account
Founder B loses access to their own company
Lawsuit ensues
```

**Recommended Fix:**
```typescript
// users.service.ts
async remove(requestingUserId: string, targetUserId: string, tenantId: string): Promise<void> {
  const requestingUser = await this.findOne(requestingUserId);
  const targetUser = await this.findOne(targetUserId);
  
  // Prevent admins from deleting other admins
  if (requestingUser.role === 'admin' && targetUser.role === 'admin') {
    throw new ForbiddenException('Admins cannot delete other admins');
  }
  
  // Only super admin can delete admins
  if (targetUser.role === 'admin' && requestingUser.role !== 'super_admin') {
    throw new ForbiddenException('Only super admins can delete admin users');
  }
  
  await this.usersRepository.delete(targetUserId);
}
```

**Impact:** 🟡 **MEDIUM** - Business disruption risk
**Effort:** 🟢 **LOW** - 1 hour to fix

---

### 3️⃣ **HIGH: No Audit Trail for Impersonation**

**Current State:**
```typescript
@Post('tenants/:id/impersonate')
async impersonateTenant(@Param('id') id: string) {
  return this.superAdminService.impersonateTenant(id);
}
```

**The Problem:**
- Super admin can impersonate anyone
- No log of who was impersonated, when, or why
- Compliance nightmare (GDPR, HIPAA, SOC 2)

**Real-World Scenario:**
```
Customer: "Someone accessed my account on March 15th"
You: "Let me check the logs..."
Logs: *crickets*
Customer: "I'm reporting you to the data protection authority"
```

**Recommended Fix:**
```typescript
// Create audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR NOT NULL,  -- 'impersonate', 'delete_user', etc.
  actor_id UUID NOT NULL,   -- Who did it
  target_id UUID,           -- Who it was done to
  tenant_id UUID,
  ip_address VARCHAR,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

// Log every impersonation
async impersonateTenant(superAdminId: string, tenantId: string, ipAddress: string) {
  const token = await this.generateImpersonationToken(tenantId);
  
  // Log the impersonation
  await this.auditLogService.create({
    action: 'impersonate',
    actorId: superAdminId,
    targetId: tenantId,
    ipAddress,
    metadata: { reason: 'customer support' }
  });
  
  return token;
}
```

**Impact:** 🔴 **HIGH** - Compliance risk
**Effort:** 🟡 **MEDIUM** - 4 hours to implement

---

### 4️⃣ **MEDIUM: Tenant Creation Flow Not Clear**

**Current State:**
```typescript
// When user registers, tenant is auto-created
const tenant = await this.tenantsService.create({ name: tenantName });
const user = await this.usersService.create({
  ...registerDto,
  tenantId: tenant.id,
  role: 'admin',
});
```

**The Problem:**
- What if tenant creation fails but user is created?
- What if user creation fails but tenant exists?
- No transaction wrapping
- Orphaned data risk

**Recommended Fix:**
```typescript
async register(registerDto: RegisterDto) {
  // Use database transaction
  return await this.dataSource.transaction(async (manager) => {
    // Create tenant first
    const tenant = await manager.save(Tenant, {
      name: `${registerDto.firstName} ${registerDto.lastName}'s Workspace`,
      slug: this.generateSlug(registerDto.email),
      status: 'active'
    });
    
    // Then create admin user
    const user = await manager.save(User, {
      ...registerDto,
      tenantId: tenant.id,
      role: 'admin',
      password: await this.hashPassword(registerDto.password)
    });
    
    // If anything fails, both rollback
    return { user, tenant };
  });
}
```

**Impact:** 🟡 **MEDIUM** - Data integrity risk
**Effort:** 🟢 **LOW** - 2 hours to fix

---

### 5️⃣ **MEDIUM: No Multi-Agent Inbox Permissions**

**Current State:**
```typescript
// All agents can see ALL conversations
// No concept of "assigned to me" vs "team inbox"
```

**The Problem:**
- Agent A can see Agent B's private conversations
- No way to restrict sensitive conversations
- Privacy concerns for customers

**Recommended Fix:**
```typescript
// Add conversation assignment
CREATE TABLE conversation_assignments (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  assigned_to_user_id UUID NOT NULL,
  assigned_by_user_id UUID NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW()
);

// Add inbox mode to tenant settings
interface TenantSettings {
  inboxMode: 'shared' | 'assigned' | 'private';
  // shared: all agents see all conversations
  // assigned: agents only see assigned conversations
  // private: agents only see their own conversations
}

// Filter conversations based on mode
async findAll(tenantId: string, userId: string, userRole: string) {
  const tenant = await this.tenantsService.findOne(tenantId);
  const inboxMode = tenant.settings?.inboxMode || 'shared';
  
  let query = this.conversationsRepository
    .createQueryBuilder('conversation')
    .where('conversation.tenantId = :tenantId', { tenantId });
  
  if (userRole === 'agent') {
    if (inboxMode === 'assigned') {
      query = query.andWhere('conversation.assignedTo = :userId', { userId });
    } else if (inboxMode === 'private') {
      query = query.andWhere('conversation.createdBy = :userId', { userId });
    }
  }
  
  return query.getMany();
}
```

**Impact:** 🟡 **MEDIUM** - Privacy risk
**Effort:** 🟠 **HIGH** - 8 hours to implement

---

### 6️⃣ **LOW: No Rate Limiting on Sensitive Operations**

**Current State:**
```typescript
// No rate limiting on:
- Login attempts
- API key creation
- Webhook creation
```

**The Problem:**
- Brute force attacks on login
- API key spam
- Webhook spam (DDoS your own system)

**Recommended Fix:**
```typescript
// Install throttler
npm install @nestjs/throttler

// Add to app.module.ts
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
}),

// Add to sensitive endpoints
@UseGuards(ThrottlerGuard)
@Throttle(5, 60)  // 5 requests per 60 seconds
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // ...
}

@UseGuards(ThrottlerGuard)
@Throttle(10, 3600)  // 10 API keys per hour
@Post('api-keys')
async createApiKey() {
  // ...
}
```

**Impact:** 🟢 **LOW** - Abuse prevention
**Effort:** 🟢 **LOW** - 1 hour to implement

---

### 7️⃣ **LOW: No Password Policy**

**Current State:**
```typescript
// No password requirements
// Users can set "123456" as password
```

**The Problem:**
- Weak passwords = easy to crack
- No enforcement of complexity

**Recommended Fix:**
```typescript
// register.dto.ts
import { IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }, {
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'
  })
  password: string;
}
```

**Impact:** 🟢 **LOW** - Account security
**Effort:** 🟢 **LOW** - 30 minutes to fix

---

## 📋 Implementation Priority

### Phase 1: Critical (Do This Week)
1. ✅ Restrict API Keys to Admin only
2. ✅ Restrict Webhooks to Admin only
3. ✅ Restrict WhatsApp Connections to Admin only
4. ✅ Prevent admins from deleting other admins

**Estimated Time:** 4 hours
**Risk Reduction:** 80%

### Phase 2: High Priority (Do This Month)
5. ✅ Add audit logging for impersonation
6. ✅ Add transaction wrapping to registration
7. ✅ Add rate limiting

**Estimated Time:** 8 hours
**Risk Reduction:** 15%

### Phase 3: Nice to Have (Do When Scaling)
8. ✅ Implement inbox permission modes
9. ✅ Add password policy
10. ✅ Add 2FA (future consideration)

**Estimated Time:** 12 hours
**Risk Reduction:** 5%

---

## 🎯 Quick Wins (Do These First)

### 1. Add Role Guards (30 minutes)
```bash
# Files to modify:
backend/src/modules/api-keys/api-keys.controller.ts
backend/src/modules/webhooks/webhooks.controller.ts
backend/src/modules/whatsapp/whatsapp.controller.ts
```

### 2. Prevent Admin Deletion (1 hour)
```bash
# Files to modify:
backend/src/modules/users/users.service.ts
backend/src/modules/users/users.controller.ts
```

### 3. Add Rate Limiting (1 hour)
```bash
npm install @nestjs/throttler
# Modify: backend/src/app.module.ts
```

---

## 📊 Risk Assessment

| Issue | Current Risk | After Fix | Business Impact |
|-------|-------------|-----------|-----------------|
| Agent API Key Access | 🔴 Critical | 🟢 Low | Data breach prevention |
| Admin Deletion | 🟡 Medium | 🟢 Low | Business continuity |
| No Audit Trail | 🔴 Critical | 🟢 Low | Compliance |
| Tenant Creation | 🟡 Medium | 🟢 Low | Data integrity |
| Inbox Permissions | 🟡 Medium | 🟢 Low | Privacy |
| No Rate Limiting | 🟢 Low | 🟢 Low | Abuse prevention |
| Weak Passwords | 🟢 Low | 🟢 Low | Account security |

---

## ✅ What You're Doing Right

1. ✅ Tenant isolation is perfect
2. ✅ Role hierarchy is clean
3. ✅ JWT implementation is solid
4. ✅ Password hashing is correct
5. ✅ API structure is well-designed

---

## 🚀 Next Steps

1. Review this document with your team
2. Prioritize Phase 1 fixes
3. Create tickets for each issue
4. Implement fixes in order of priority
5. Add security testing to your CI/CD

**Want me to implement any of these fixes?** Just say which one!
