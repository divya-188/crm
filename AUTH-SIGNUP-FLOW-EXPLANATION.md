# Authentication & Signup Flow - Complete Explanation

## Overview
This document explains how the signup/registration process works in the WhatsApp CRM SaaS platform, including the role system, tenant creation, and user management flow from top to bottom.

---

## 🔐 Current Signup Flow (Step-by-Step)

### 1. **User Fills Registration Form** (Frontend)
**File:** `frontend/src/pages/auth/Register.tsx`

```
User enters:
├── First Name: "John"
├── Last Name: "Doe"
├── Email: "john@example.com"
├── Password: "password123" (min 8 chars)
└── Accepts Terms: ✓
```

**Validation:**
- Password must be at least 8 characters
- Email must be valid format
- Terms must be accepted
- All fields are required

---

### 2. **Frontend Sends Registration Request**
**File:** `frontend/src/pages/auth/Register.tsx` → `authService.register()`

```typescript
POST /auth/register
Body: {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "password123"
}
```

---

### 3. **Backend Receives Request** (Controller)
**File:** `backend/src/modules/auth/auth.controller.ts`

```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}
```

**DTO Validation:**
- Email format validation
- Password minimum length (8 chars)
- Required fields check

---

### 4. **Auth Service Processes Registration** (Core Logic)
**File:** `backend/src/modules/auth/auth.service.ts`

#### Step 4.1: Check if Email Already Exists
```typescript
const existingUser = await this.usersService.findByEmail(registerDto.email);
if (existingUser) {
  throw new ConflictException('Email already exists');
}
```

#### Step 4.2: **Create Tenant (Workspace)** ⭐ KEY STEP
```typescript
const tenantName = `${registerDto.firstName} ${registerDto.lastName}'s Workspace`;
// Example: "John Doe's Workspace"

const tenant = await this.tenantsService.create({ name: tenantName });
```

**What happens in Tenant Creation:**
**File:** `backend/src/modules/tenants/tenants.service.ts`

```typescript
async create(tenantData: Partial<Tenant>): Promise<Tenant> {
  // 1. Generate unique slug from name
  slug = "john-does-workspace"
  
  // 2. Ensure slug is unique (add counter if needed)
  // If exists: "john-does-workspace-1", "john-does-workspace-2", etc.
  
  // 3. Set trial period (14 days)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  
  // 4. Create tenant with TRIAL status
  const tenant = {
    name: "John Doe's Workspace",
    slug: "john-does-workspace",
    status: TenantStatus.TRIAL,  // ← Starts in TRIAL mode
    trialEndsAt: trialEndsAt,
  };
  
  return this.tenantsRepository.save(tenant);
}
```

**Tenant Statuses:**
- `TRIAL` - 14-day free trial (default for new signups)
- `ACTIVE` - Paid subscription active
- `SUSPENDED` - Payment failed or account suspended
- `CANCELLED` - Subscription cancelled

#### Step 4.3: **Hash Password**
```typescript
const hashedPassword = await this.usersService.hashPassword(registerDto.password);
// Uses bcrypt with salt rounds = 10
```

#### Step 4.4: **Create User with ADMIN Role** ⭐ KEY STEP
```typescript
const user = await this.usersService.create({
  ...registerDto,
  password: hashedPassword,
  tenantId: tenant.id,           // ← Links user to their tenant
  role: 'admin',                 // ← FIRST USER IS ALWAYS ADMIN
});
```

**Why Admin Role?**
- The first user who signs up creates a new workspace (tenant)
- They become the **owner/admin** of that workspace
- They can later invite other users as agents or users
- This is the **multi-tenant SaaS model**

#### Step 4.5: **Generate JWT Tokens**
```typescript
const tokens = await this.generateTokens(user);
// Generates:
// - accessToken (expires in 15 minutes)
// - refreshToken (expires in 7 days)

// Token payload includes:
{
  sub: user.id,
  email: user.email,
  role: user.role,        // ← "admin"
  tenantId: user.tenantId // ← Links to workspace
}
```

#### Step 4.6: **Store Refresh Token**
```typescript
await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
// Hashed and stored in database for security
```

#### Step 4.7: **Return User & Tokens**
```typescript
const { password, refreshToken, ...userWithoutSensitive } = user;
return { user: userWithoutSensitive, tokens };
```

---

### 5. **Frontend Receives Response**
**File:** `frontend/src/pages/auth/Register.tsx`

```typescript
// Success response:
{
  user: {
    id: "uuid",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "admin",           // ← User is admin
    tenantId: "tenant-uuid", // ← Their workspace ID
    status: "active"
  },
  tokens: {
    accessToken: "jwt-token",
    refreshToken: "jwt-refresh-token"
  }
}
```

**Frontend Actions:**
1. Shows success toast: "Account created successfully!"
2. Redirects to login page: `navigate('/auth/login')`
3. User must log in to access the system

---

## 👥 Role System Explained

### Available Roles

**File:** `backend/src/modules/users/entities/user.entity.ts`

```typescript
export const UserRole = {
  SUPER_ADMIN: 'super_admin',  // Platform administrator (not used in signup)
  ADMIN: 'admin',              // Workspace owner/admin
  AGENT: 'agent',              // Customer service agent
  USER: 'user',                // Basic user
} as const;
```

### Role Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────┐
│ SUPER_ADMIN (Platform Level)                           │
│ - Manages all tenants                                   │
│ - System configuration                                  │
│ - Not created through signup                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ ADMIN (Tenant Level) ← CREATED ON SIGNUP               │
│ - Full access to their workspace                        │
│ - Manage users (invite agents/users)                    │
│ - Manage subscriptions                                  │
│ - Configure WhatsApp connections                        │
│ - Create flows, campaigns, templates                    │
│ - View analytics                                        │
│ - Manage API keys & webhooks                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ AGENT (Invited by Admin)                                │
│ - Handle conversations                                  │
│ - Manage contacts                                       │
│ - Send messages                                         │
│ - View assigned conversations                           │
│ - Cannot manage users or billing                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ USER (Basic Access)                                     │
│ - Limited read-only access                              │
│ - View conversations                                    │
│ - Cannot modify settings                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🏢 Multi-Tenant Architecture

### How Tenants Work

```
Signup Flow:
User Signs Up → Creates Tenant → User becomes Admin of that Tenant

Example:
┌──────────────────────────────────────────────────────────┐
│ Tenant 1: "John Doe's Workspace"                         │
│ ├── Admin: john@example.com (role: admin)               │
│ ├── Agent: agent1@example.com (role: agent)             │
│ ├── Agent: agent2@example.com (role: agent)             │
│ └── Data: Contacts, Conversations, Flows, etc.          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Tenant 2: "Jane Smith's Workspace"                       │
│ ├── Admin: jane@example.com (role: admin)               │
│ ├── Agent: support@example.com (role: agent)            │
│ └── Data: Contacts, Conversations, Flows, etc.          │
└──────────────────────────────────────────────────────────┘
```

**Key Points:**
- Each tenant is completely isolated
- Data is never shared between tenants
- Each tenant has its own admin(s)
- Tenant ID is included in JWT token
- All API requests are scoped to tenant

---

## 🔑 JWT Token Structure

### Access Token Payload
```json
{
  "sub": "user-uuid",
  "email": "john@example.com",
  "role": "admin",
  "tenantId": "tenant-uuid",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Usage:**
- Sent with every API request in Authorization header
- Backend validates token and extracts user info
- `tenantId` ensures data isolation
- `role` determines permissions

---

## 🔄 Complete User Journey

### 1. New User Signs Up
```
1. User visits /auth/register
2. Fills form (name, email, password)
3. Submits form
4. Backend creates:
   ├── New Tenant (workspace)
   └── New User (as admin of that tenant)
5. User receives success message
6. Redirected to /auth/login
```

### 2. User Logs In
```
1. User visits /auth/login
2. Enters email & password
3. Backend validates credentials
4. Returns JWT tokens
5. Frontend stores tokens in localStorage
6. User redirected to /dashboard
```

### 3. Admin Invites Team Members
```
1. Admin goes to Users/Team page
2. Clicks "Invite User"
3. Enters email and selects role (agent/user)
4. Backend creates user with selected role
5. New user receives invitation email
6. New user can log in with assigned role
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'user',        -- admin, agent, user
  status VARCHAR DEFAULT 'active',    -- active, inactive, suspended
  tenantId UUID NOT NULL,             -- Links to tenant
  avatar VARCHAR,
  phone VARCHAR,
  refreshToken VARCHAR,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Tenants Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'trial',     -- trial, active, suspended, cancelled
  trialEndsAt TIMESTAMP,
  settings JSONB,
  limits JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Why First User is Admin?

### SaaS Multi-Tenant Model

**Traditional Approach (Single Tenant):**
```
Company → Installs Software → Creates Admin Account → Invites Users
```

**SaaS Approach (Multi-Tenant):**
```
User Signs Up → Creates Workspace → Becomes Admin → Invites Team
```

**Benefits:**
1. **Self-Service**: Users can start immediately without sales calls
2. **Scalability**: Each customer has their own isolated workspace
3. **Flexibility**: Each workspace can have different settings
4. **Security**: Complete data isolation between customers
5. **Billing**: Each tenant can have separate subscription

---

## 🔒 Security Considerations

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Never returned in API responses

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens hashed before storage
- Tokens invalidated on logout

### Tenant Isolation
- Every API request includes tenantId from JWT
- Database queries filtered by tenantId
- No cross-tenant data access possible

---

## 🚀 How to Add More Users

### Option 1: Admin Invites Users (Recommended)
```typescript
// Admin creates invitation
POST /users/invite
{
  email: "agent@example.com",
  role: "agent",
  firstName: "Agent",
  lastName: "Smith"
}

// System sends invitation email
// New user sets password and logs in
```

### Option 2: Direct User Creation (Admin Only)
```typescript
// Admin creates user directly
POST /users
{
  email: "user@example.com",
  password: "tempPassword123",
  role: "agent",
  firstName: "New",
  lastName: "Agent"
}
```

---

## 📝 Summary

### Current Signup Flow:
1. ✅ User signs up with email/password
2. ✅ System creates new tenant (workspace)
3. ✅ User becomes **admin** of that tenant
4. ✅ User gets 14-day trial period
5. ✅ User can invite team members as agents/users
6. ✅ Each tenant is completely isolated

### Role Assignment:
- **Signup**: Always creates `admin` role
- **Invitation**: Admin chooses role (agent/user)
- **Manual**: Admin can change roles later

### Why This Design?
- **SaaS Best Practice**: Each customer gets their own workspace
- **Self-Service**: No manual intervention needed
- **Scalable**: Supports unlimited tenants
- **Secure**: Complete data isolation
- **Flexible**: Each workspace independent

---

## 🔧 How to Change Default Role

If you want to change the default role for new signups (not recommended for SaaS):

**File:** `backend/src/modules/auth/auth.service.ts`

```typescript
// Current (Line 28):
const user = await this.usersService.create({
  ...registerDto,
  password: hashedPassword,
  tenantId: tenant.id,
  role: 'admin', // ← Change this to 'user' or 'agent'
});

// But this breaks the SaaS model because:
// - Who will be the admin of the workspace?
// - How will they invite other users?
// - How will they manage settings?
```

**Better Approach:**
Keep first user as admin, but add a separate "Join Workspace" flow where users can join existing workspaces with lower roles.

---

## 🎓 Key Takeaways

1. **First user = Admin**: This is intentional for SaaS model
2. **One tenant per signup**: Each signup creates isolated workspace
3. **Role hierarchy**: Admin > Agent > User
4. **Tenant isolation**: Complete data separation
5. **JWT includes tenantId**: Ensures proper data scoping
6. **Trial period**: 14 days by default
7. **Invite system**: Admins can add team members

This design follows industry-standard SaaS architecture patterns used by platforms like Slack, Notion, and Intercom.
