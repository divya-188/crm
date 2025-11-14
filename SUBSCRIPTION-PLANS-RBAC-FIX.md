# Subscription Plans Role-Based Access Control Fix

## Problem
Subscription plans were accessible to both Admin and Super Admin roles, which is incorrect because subscription plans are **platform-level settings** that should only be managed by Super Admins.

## Root Cause
1. **Backend**: No role guards on create/update/delete endpoints - only JWT authentication
2. **Frontend**: Page was in `/admin` routes, accessible to tenant admins

## Solution Implemented

### Backend Changes (`backend/src/modules/subscriptions/subscription-plans.controller.ts`)

Added role-based guards to restrict plan management to Super Admins only:

```typescript
// Added imports
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Added RolesGuard to controller
@UseGuards(JwtAuthGuard, RolesGuard)

// Protected endpoints with @Roles('super_admin')
@Post()
@Roles('super_admin')  // ✅ Only Super Admin can create

@Patch(':id')
@Roles('super_admin')  // ✅ Only Super Admin can update

@Delete(':id')
@Roles('super_admin')  // ✅ Only Super Admin can delete
```

**Note**: GET endpoints remain accessible to all authenticated users so they can view available plans.

### Frontend Changes

**1. Moved Page File**
- From: `frontend/src/pages/admin/SubscriptionPlans.tsx`
- To: `frontend/src/pages/super-admin/SubscriptionPlans.tsx`

**2. Updated Routes** (`frontend/src/routes/index.tsx`)
- Removed `/admin/plans` route
- Added `/super-admin/plans` route
- Updated import to reference super-admin folder

## Access Control Summary

### Before Fix
- ❌ Admin (tenant-level) could create/edit/delete plans
- ❌ Super Admin could create/edit/delete plans
- ❌ Agent could potentially access if they knew the route

### After Fix
- ❌ Admin cannot access subscription plans page
- ✅ Super Admin can access and manage plans
- ❌ Agent cannot access subscription plans
- ✅ Backend enforces role check even if frontend is bypassed

## Testing

To verify the fix:

1. **As Super Admin**: Navigate to `/super-admin/plans` - should work
2. **As Admin**: Try to access `/super-admin/plans` - should be blocked by RoleBasedRoute
3. **API Test**: Try to POST to `/api/v1/subscription-plans` as Admin - should return 403 Forbidden

## Security Benefits

1. **Defense in Depth**: Both frontend and backend enforce the restriction
2. **Platform Integrity**: Prevents tenant admins from modifying global pricing
3. **Proper Separation**: Clear distinction between tenant-level and platform-level administration

## Related Files Modified

- `backend/src/modules/subscriptions/subscription-plans.controller.ts`
- `frontend/src/pages/super-admin/SubscriptionPlans.tsx` (moved)
- `frontend/src/routes/index.tsx`
