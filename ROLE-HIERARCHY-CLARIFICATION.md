# Role Hierarchy Clarification

## ✅ Current System (CORRECT)

The system already has the correct role hierarchy implemented:

### Role Levels
1. **super_admin** - Platform Administrator
   - Manages all tenants
   - Creates/edits/deletes subscription plans
   - Views platform-wide analytics
   - Access: `/super-admin/*` routes

2. **admin** - Tenant Owner/Administrator  
   - Manages their own tenant
   - Manages users and agents within their tenant
   - Manages contacts, campaigns, automations
   - Views subscription plans (read-only)
   - Access: `/admin/*` routes

3. **agent** - Customer Service Agent
   - Handles conversations and contacts
   - Limited management capabilities
   - Access: `/agent/*` routes

4. **user** - End Customer
   - Regular user access
   - Access: `/` routes (user dashboard)

## Implementation Status

### ✅ Backend (Correct)
- `backend/src/modules/users/entities/user.entity.ts` - Defines roles correctly
- Role enum: `super_admin`, `admin`, `agent`, `user`
- No 'tenant' role exists
- Auth service creates first user as 'admin' (tenant owner)

### ✅ Frontend Routes (Correct)
- `/super-admin/*` - For super_admin role
- `/admin/*` - For admin role (tenant owners)
- `/agent/*` - For agent role  
- `/` - For user role

### ✅ Layouts (Correct)
- `SuperAdminLayout` - For super_admin
- `AdminLayout` - For admin (tenant owners)
- `AgentLayout` - For agent
- `UserLayout` - For regular users

## Key Points

### Admin = Tenant Owner
The `admin` role IS the tenant owner. There is no separate 'tenant' role.

When a new tenant signs up:
1. A tenant record is created
2. The first user is created with role='admin'
3. This admin user is the tenant owner
4. They can create more users and agents within their tenant

### Subscription Plans Access
- **super_admin**: Full CRUD access (create, read, update, delete)
- **admin**: Read-only access (view plans for their subscription)
- **agent**: No access
- **user**: No access

### Tenant Management
- **super_admin**: Can view and manage all tenants
- **admin**: Can only manage their own tenant settings
- **agent**: No access
- **user**: No access

## No Changes Needed

The system is already correctly implemented. The confusion was just in terminology:
- ❌ There is NO 'tenant' role
- ✅ The 'admin' role IS the tenant owner/administrator

## Current Subscription Plans Issue - RESOLVED

The subscription plans page now correctly:
- Shows create/edit/delete buttons ONLY to super_admin
- Shows view-only access to admin (tenant owners)
- Is accessible at both `/super-admin/plans` and `/admin/plans`
