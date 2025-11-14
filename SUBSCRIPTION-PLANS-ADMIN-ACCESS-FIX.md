# Subscription Plans Admin Access Fix

## Problem
The subscription plans page was showing 404 errors for both admin and super-admin users because it was only configured in the super-admin routes.

## Requirements
- Admin users should be able to VIEW subscription plans
- Only super-admin users should be able to CREATE, EDIT, or DELETE plans
- The page should be accessible from both `/admin/plans` and `/super-admin/plans`

## Solution Implemented

### 1. Frontend Routing (frontend/src/routes/index.tsx)
Added the subscription plans route to the admin routes:

```typescript
{
  path: 'plans',
  element: <SubscriptionPlans />,
}
```

Now the page is accessible at:
- `/admin/plans` - For admin users (view-only)
- `/super-admin/plans` - For super-admin users (full access)

### 2. Role-Based UI Controls (frontend/src/pages/super-admin/SubscriptionPlans.tsx)
Updated the SubscriptionPlans component to conditionally show/hide actions based on user role:

**Added:**
- Import `useAuthStore` to access current user
- Check if user is super_admin: `const isSuperAdmin = user?.role === 'super_admin'`

**Conditional Rendering:**
- "Create Plan" button - Only visible to super_admin
- Edit/Delete/Toggle Active actions in dropdown menus - Only visible to super_admin
- All viewing functionality (list, grid, filters, comparison) - Available to both roles

### 3. Backend Permissions (Already Configured)
The backend controller already has proper role guards:
- `GET /subscription-plans` - Available to all authenticated users
- `POST /subscription-plans` - Requires `@Roles('super_admin')`
- `PATCH /subscription-plans/:id` - Requires `@Roles('super_admin')`
- `DELETE /subscription-plans/:id` - Requires `@Roles('super_admin')`

### 4. Sidebar Navigation (Already Configured)
The AdminLayout sidebar already includes the subscription plans link at `/admin/plans`

## Testing
1. Login as admin user → Navigate to `/admin/plans` → Should see plans list without create/edit/delete buttons
2. Login as super_admin user → Navigate to `/super-admin/plans` → Should see full functionality
3. Admin user attempting to create/edit/delete via API → Should receive 403 Forbidden

## Files Modified
- `frontend/src/routes/index.tsx` - Added plans route to admin routes
- `frontend/src/pages/super-admin/SubscriptionPlans.tsx` - Added role-based UI controls

## All Protected UI Elements
1. **Header "Create Plan" button** - Only visible to super_admin
2. **Grid/List view action dropdowns** (Edit, Delete, Toggle Active) - Only visible to super_admin
3. **Empty state "Create Plan" button** - Only visible to super_admin
4. **Empty state message** - Different text for admin vs super_admin

## Debugging
Added console logs to verify user role:
```typescript
console.log('Current user:', user);
console.log('Is super admin:', isSuperAdmin);
```

Check browser console to verify the role is being read correctly. If you see the Create Plan button as admin:
1. Check console logs - user.role should be 'admin' not 'super_admin'
2. Clear browser cache and hard reload (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Log out and log back in to refresh the auth token

## Result
✅ Admin users can now view subscription plans at `/admin/plans`
✅ Super-admin users have full CRUD access at `/super-admin/plans`
✅ UI properly hides ALL modification actions from admin users
✅ Backend enforces permissions at the API level
✅ Empty state properly adapts to user role
