# Role Consolidation Plan

## Current Problem
The system has both `admin` and `tenant` roles which are redundant. This creates confusion and unnecessary complexity.

## Correct Role Hierarchy
1. **super_admin** - Platform administrator (manages all tenants, subscription plans)
2. **admin** - Tenant owner/administrator (manages their tenant, users, agents, customers)
3. **agent** - Customer service agent (handles conversations, contacts)
4. **user** - End customer (interacts with the system)

## Changes Required

### 1. Database & Backend
- [ ] Update user entity to remove 'tenant' role references
- [ ] Update all role guards to use 'admin' instead of 'tenant'
- [ ] Update role decorators throughout controllers
- [ ] Update seed scripts
- [ ] Create migration to update existing 'tenant' users to 'admin'

### 2. Frontend Routes
- [ ] Keep `/super-admin/*` routes for super_admin role
- [ ] Keep `/admin/*` routes for admin role (tenant owners)
- [ ] Keep `/agent/*` routes for agent role
- [ ] Remove any tenant-specific routes

### 3. Frontend Layouts
- [ ] Keep SuperAdminLayout for super_admin
- [ ] Keep AdminLayout for admin (tenant owners)
- [ ] Keep AgentLayout for agent
- [ ] Remove any TenantLayout if exists

### 4. Role-Based Access Control
- [ ] Subscription Plans: super_admin can create/edit/delete, admin can view only
- [ ] Tenants Management: super_admin only
- [ ] Users Management: admin and super_admin
- [ ] Agents Management: admin and super_admin
- [ ] Contacts/Conversations: admin and agent
- [ ] Settings: admin for tenant settings, super_admin for platform settings

### 5. Navigation & Sidebar
- [ ] Update AdminLayout sidebar (for tenant owners)
- [ ] Update SuperAdminLayout sidebar (for platform admins)
- [ ] Update AgentLayout sidebar

## Implementation Steps

### Step 1: Backend Role Update
1. Update `backend/src/modules/users/entities/user.entity.ts` - role enum
2. Update all controllers with `@Roles('tenant')` to `@Roles('admin')`
3. Update role guards
4. Create database migration

### Step 2: Frontend Route Consolidation
1. Verify all `/admin/*` routes are for tenant owners
2. Remove any `/tenant/*` routes if they exist
3. Update RoleBasedRoute components

### Step 3: Update Auth & Registration
1. Update registration flow to use 'admin' role for tenant owners
2. Update login flow
3. Update role checks in auth store

### Step 4: Testing
1. Test super_admin access
2. Test admin (tenant owner) access
3. Test agent access
4. Test user access

## Files to Check/Update

### Backend
- `backend/src/modules/users/entities/user.entity.ts`
- `backend/src/modules/auth/guards/roles.guard.ts`
- `backend/src/modules/auth/decorators/roles.decorator.ts`
- All controller files with `@Roles()` decorators
- `backend/src/database/seeds/*.ts`
- Migration files

### Frontend
- `frontend/src/routes/index.tsx`
- `frontend/src/components/routes/RoleBasedRoute.tsx`
- `frontend/src/components/layouts/*Layout.tsx`
- `frontend/src/lib/auth.store.ts`
- `frontend/src/pages/auth/Register.tsx`

## Current Status
- [ ] Plan created
- [ ] Backend changes
- [ ] Frontend changes
- [ ] Testing
- [ ] Documentation updated
