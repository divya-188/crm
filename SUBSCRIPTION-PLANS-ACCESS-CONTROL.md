# 🔐 Subscription Plans Access Control

## Who Can Create Subscription Plans?

### ✅ Answer: **ONLY Super Admins**

---

## 📋 Role-Based Access Control (RBAC)

### Backend Controller: `subscription-plans.controller.ts`

```typescript
@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← All routes require authentication
export class SubscriptionPlansController {
  
  // CREATE - Super Admin Only
  @Post()
  @Roles('super_admin')  // ← Only super_admin role can create
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.subscriptionPlansService.create(createPlanDto);
  }

  // UPDATE - Super Admin Only
  @Patch(':id')
  @Roles('super_admin')  // ← Only super_admin role can update
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.subscriptionPlansService.update(id, updatePlanDto);
  }

  // DELETE - Super Admin Only
  @Delete(':id')
  @Roles('super_admin')  // ← Only super_admin role can delete
  remove(@Param('id') id: string) {
    return this.subscriptionPlansService.remove(id);
  }

  // READ - All Authenticated Users
  @Get()
  findAll() {
    // No @Roles decorator = all authenticated users can view
    return this.subscriptionPlansService.findAll();
  }
}
```

---

## 🎯 Access Matrix

| Action | Super Admin | Admin | Agent | User |
|--------|-------------|-------|-------|------|
| **Create Plan** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Edit Plan** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Delete Plan** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **View Plans** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Compare Plans** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Check Features** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🔒 Security Implementation

### 1. Authentication Guard
```typescript
@UseGuards(JwtAuthGuard)
```
- Ensures user is logged in
- Validates JWT token
- Blocks unauthenticated requests

### 2. Role Guard
```typescript
@UseGuards(RolesGuard)
```
- Checks user's role from JWT payload
- Compares against required roles
- Blocks unauthorized role access

### 3. Role Decorator
```typescript
@Roles('super_admin')
```
- Specifies which roles can access the endpoint
- Applied to CREATE, UPDATE, DELETE operations
- Not applied to READ operations (all authenticated users can read)

---

## 🚫 What Happens If Non-Super Admin Tries to Create?

### Scenario: Admin tries to create a plan

```bash
POST /api/v1/subscription-plans
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### Flow:
1. ✅ JwtAuthGuard passes (user is authenticated)
2. ❌ RolesGuard fails (user role is 'admin', not 'super_admin')
3. 🚫 Request blocked with 403 Forbidden

---

## 👤 Role Hierarchy

```
┌─────────────────────────────────────────┐
│         Super Admin (super_admin)       │  ← Can create/edit/delete plans
│  • Full system access                   │
│  • Manage all tenants                   │
│  • Create subscription plans            │
│  • Configure system settings            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│            Admin (admin)                │  ← Can only view plans
│  • Manage tenant                        │
│  • Manage users                         │
│  • View subscription plans              │
│  • Cannot create/edit plans             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│            Agent (agent)                │  ← Can only view plans
│  • Handle conversations                 │
│  • Manage contacts                      │
│  • View subscription plans              │
│  • Cannot create/edit plans             │
└─────────────────────────────────────────┘
```

---

## 🎨 Frontend Access Control

### Component: `SubscriptionPlans.tsx`

```typescript
const SubscriptionPlans: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div>
      {/* Create button - Only visible to Super Admins */}
      {isSuperAdmin && (
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      )}

      {/* Plan cards */}
      {plans.map(plan => (
        <Card>
          {/* Edit/Delete actions - Only visible to Super Admins */}
          {isSuperAdmin && (
            <div>
              <button onClick={() => handleEdit(plan)}>Edit</button>
              <button onClick={() => handleDelete(plan)}>Delete</button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
```

### UI Behavior by Role:

**Super Admin sees:**
- ✅ "Create Plan" button
- ✅ Edit button on each plan
- ✅ Delete button on each plan
- ✅ All plan details

**Admin/Agent sees:**
- ❌ No "Create Plan" button
- ❌ No Edit button
- ❌ No Delete button
- ✅ All plan details (read-only)

---

## 🔐 API Endpoints Summary

### Protected Endpoints (Super Admin Only)

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/subscription-plans` | 🔒 Super Admin | Create new plan |
| PATCH | `/subscription-plans/:id` | 🔒 Super Admin | Update plan |
| DELETE | `/subscription-plans/:id` | 🔒 Super Admin | Delete plan |

### Public Endpoints (All Authenticated Users)

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/subscription-plans` | 🔓 All Users | List all plans |
| GET | `/subscription-plans/:id` | 🔓 All Users | Get plan details |
| GET | `/subscription-plans/compare` | 🔓 All Users | Compare plans |
| GET | `/subscription-plans/:id/check-feature/:feature` | 🔓 All Users | Check feature availability |
| GET | `/subscription-plans/:id/check-limit/:limitKey` | 🔓 All Users | Check limit value |

---

## 🧪 Testing Access Control

### Test 1: Super Admin Creates Plan ✅

```bash
# Login as super admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperAdmin123!"
  }'

# Create plan (should succeed)
curl -X POST http://localhost:3000/api/v1/subscription-plans \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plan",
    "price": 99.99,
    "billingCycle": "monthly",
    "features": {
      "maxContacts": 50000,
      "maxUsers": 50,
      "hasAdvancedAnalytics": true
    }
  }'

# Expected: 201 Created
```

### Test 2: Admin Tries to Create Plan ❌

```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tenant1.com",
    "password": "Admin123!"
  }'

# Try to create plan (should fail)
curl -X POST http://localhost:3000/api/v1/subscription-plans \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plan",
    "price": 99.99,
    "billingCycle": "monthly",
    "features": {}
  }'

# Expected: 403 Forbidden
```

### Test 3: Admin Views Plans ✅

```bash
# View plans (should succeed)
curl -X GET http://localhost:3000/api/v1/subscription-plans \
  -H "Authorization: Bearer <admin_token>"

# Expected: 200 OK with plan list
```

---

## 📝 Why Only Super Admins?

### Business Reasons:

1. **Revenue Control**
   - Subscription plans directly impact revenue
   - Pricing changes affect all tenants
   - Requires highest level of authority

2. **System-Wide Impact**
   - Plans affect all tenants in the system
   - Feature limits control system resources
   - Mistakes can break billing for everyone

3. **Strategic Decisions**
   - Pricing strategy is a business decision
   - Feature bundling affects market positioning
   - Requires executive-level approval

4. **Security & Compliance**
   - Prevents unauthorized price changes
   - Maintains audit trail at highest level
   - Ensures regulatory compliance

### Technical Reasons:

1. **Data Integrity**
   - Plans are referenced by subscriptions
   - Changes affect active billing cycles
   - Requires careful validation

2. **System Stability**
   - Feature limits control resource usage
   - Incorrect limits can crash the system
   - Needs expert configuration

3. **Multi-Tenancy**
   - Plans are shared across all tenants
   - One bad plan affects everyone
   - Requires system-level access

---

## 🔄 How to Grant Access

### Option 1: Promote User to Super Admin

```typescript
// In database or via admin panel
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'user@example.com';
```

### Option 2: Create New Super Admin

```bash
# Using seed script
npm run seed:super-admin

# Or via API (requires existing super admin)
POST /api/v1/users
{
  "email": "newsuperadmin@example.com",
  "password": "SecurePassword123!",
  "role": "super_admin",
  "firstName": "New",
  "lastName": "SuperAdmin"
}
```

---

## 🎯 Summary

**Who can create subscription plans?**
- ✅ **Super Admins ONLY**

**Why this restriction?**
- 💰 Direct revenue impact
- 🌐 System-wide effects
- 🔒 Security & compliance
- 📊 Strategic business decisions

**What can others do?**
- 👀 View all plans
- 📊 Compare plans
- ✅ Check feature availability
- ❌ Cannot create/edit/delete

**How to get access?**
- 🎫 Be promoted to super_admin role
- 🔑 Contact existing super admin
- 📧 Request access from system owner

---

**Last Updated:** Now  
**Status:** ✅ Properly Secured  
**Recommendation:** Keep this restriction in place for production
