# Test Credentials for All Roles

## Setup Instructions

### 1. Create Database
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE whatscrm;

# Exit
\q
```

### 2. Run Migrations
```bash
cd backend
npm run migration:run
```

### 3. Seed Super Admin
```bash
cd backend
npm run seed:super-admin
```

### 4. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Test Accounts

### 1. Super Admin (Platform Administrator)
**Email:** `superadmin@whatscrm.com`  
**Password:** `SuperAdmin123!`  
**Access:** `/super-admin/*` routes  
**Capabilities:**
- Manage all tenants
- Create/edit/delete subscription plans
- View platform-wide analytics
- Full system access

### 2. Admin/Tenant Owner
**Create via Registration:**
1. Go to `http://localhost:5173/auth/register`
2. Sign up with your details
3. First user of a tenant becomes admin automatically

**Or use existing if seeded:**
**Email:** `admin@example.com`  
**Password:** `Admin123!`  
**Access:** `/admin/*` routes  
**Capabilities:**
- Manage their tenant
- Manage users and agents
- View subscription plans (read-only)
- Manage contacts, campaigns, automations
- Cannot create/edit subscription plans

### 3. Agent (Customer Service)
**Create via Admin Panel:**
1. Login as admin
2. Go to `/admin/users`
3. Create new user with role='agent'

**Test Credentials (if manually created):**
**Email:** `agent@example.com`  
**Password:** `Agent123!`  
**Access:** `/agent/*` routes  
**Capabilities:**
- Handle conversations
- Manage contacts
- Limited management access

### 4. User (End Customer)
**Create via Registration:**
1. Go to `http://localhost:5173/auth/register`
2. Sign up as regular user

**Test Credentials (if manually created):**
**Email:** `user@example.com`  
**Password:** `User123!`  
**Access:** `/` routes  
**Capabilities:**
- Basic user dashboard
- Limited access

## URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api

## Testing Subscription Plans Access

### As Super Admin:
1. Login with super admin credentials
2. Navigate to `/super-admin/plans`
3. ✅ Should see "Create Plan" button
4. ✅ Should see edit/delete actions on plans
5. ✅ Can create, edit, delete plans

### As Admin (Tenant Owner):
1. Login with admin credentials
2. Navigate to `/admin/plans`
3. ❌ Should NOT see "Create Plan" button
4. ❌ Should NOT see edit/delete actions
5. ✅ Can view all plans
6. ✅ Can compare plans

### As Agent:
1. Login with agent credentials
2. Navigate to `/agent/*`
3. ❌ No access to subscription plans

## Troubleshooting

### Database Connection Issues
Check `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=whatscrm
```

### Super Admin Not Created
Run the seed script:
```bash
cd backend
npm run seed:super-admin
```

### Role Not Working
1. Check browser console for user object
2. Verify role in database:
```sql
SELECT email, role FROM users;
```
3. Clear browser cache and re-login

### 404 on Routes
1. Verify user role matches route requirements
2. Check RoleBasedRoute configuration
3. Ensure user is logged in

## Quick Test Script

```bash
# 1. Setup database
createdb whatscrm

# 2. Run migrations
cd backend && npm run migration:run

# 3. Seed super admin
npm run seed:super-admin

# 4. Start backend (in one terminal)
npm run start:dev

# 5. Start frontend (in another terminal)
cd ../frontend && npm run dev

# 6. Open browser
open http://localhost:5173
```

## Expected Behavior

| Role | Route Access | Subscription Plans | Create Plans | Edit/Delete Plans |
|------|-------------|-------------------|--------------|-------------------|
| super_admin | /super-admin/* | ✅ Full Access | ✅ Yes | ✅ Yes |
| admin | /admin/* | ✅ View Only | ❌ No | ❌ No |
| agent | /agent/* | ❌ No Access | ❌ No | ❌ No |
| user | /* | ❌ No Access | ❌ No | ❌ No |
