# 🔐 Login Credentials - WhatsApp CRM

## ✅ Servers Running

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs

---

## 👤 Test Accounts

### 1. 🔴 Super Admin (Platform Administrator)

**Email:** `superadmin@whatscrm.com`  
**Password:** `SuperAdmin123!`

**Access Routes:**
- `/super-admin/dashboard`
- `/super-admin/plans` (Full CRUD)
- `/super-admin/tenants`
- `/super-admin/users`
- `/super-admin/analytics`

**Capabilities:**
- ✅ Manage all tenants
- ✅ Create/Edit/Delete subscription plans
- ✅ View platform-wide analytics
- ✅ Impersonate tenant admins
- ✅ Full system access

**Test Subscription Plans:**
1. Login at http://localhost:5173/auth/login
2. Navigate to `/super-admin/plans`
3. ✅ Should see "Create Plan" button
4. ✅ Should see Edit/Delete actions on plans
5. ✅ Can create, edit, delete plans

---

### 2. 🟢 Admin (Tenant Owner)

**Create New Account:**
1. Go to http://localhost:5173/auth/register
2. Fill in your details:
   - First Name: Your Name
   - Last Name: Your Last Name
   - Email: your-email@example.com
   - Password: YourPassword123!
   - Company Name: Your Company
3. Click "Sign Up"
4. You'll be automatically logged in as admin

**Access Routes:**
- `/admin/dashboard`
- `/admin/plans` (View Only)
- `/admin/tenants` (Own tenant only)
- `/admin/users`
- `/admin/contacts`

**Capabilities:**
- ✅ Manage their own tenant
- ✅ Create and manage users/agents
- ✅ View subscription plans (READ ONLY)
- ✅ Manage contacts, campaigns, automations
- ❌ Cannot create/edit subscription plans
- ❌ Cannot access other tenants

**Test Subscription Plans:**
1. Login with your admin account
2. Navigate to `/admin/plans`
3. ❌ Should NOT see "Create Plan" button
4. ❌ Should NOT see Edit/Delete actions
5. ✅ Can view all plans
6. ✅ Can compare plans

---

### 3. 🟡 Agent (Customer Service)

**Create via Admin Panel:**
1. Login as admin
2. Go to `/admin/users`
3. Click "Create User"
4. Fill in details and select role: "agent"
5. Save

**Access Routes:**
- `/agent/dashboard`
- `/agent/inbox`
- `/agent/contacts`

**Capabilities:**
- ✅ Handle conversations
- ✅ Manage contacts
- ✅ View assigned tasks
- ❌ No access to subscription plans
- ❌ Limited management access

---

### 4. 🔵 User (End Customer)

**Create via Registration:**
1. Go to http://localhost:5173/auth/register
2. Sign up as regular user

**Access Routes:**
- `/dashboard`
- Basic user features

**Capabilities:**
- ✅ Basic user dashboard
- ✅ Limited access
- ❌ No admin features

---

## 🎯 Quick Test Guide

### Test 1: Super Admin Full Access
```bash
1. Open: http://localhost:5173/auth/login
2. Login: superadmin@whatscrm.com / SuperAdmin123!
3. Navigate to: /super-admin/plans
4. Verify: Can see "Create Plan" button
5. Verify: Can see Edit/Delete actions
6. Try: Create a new plan
```

### Test 2: Admin View-Only Access
```bash
1. Open: http://localhost:5173/auth/register
2. Sign up with your details
3. Navigate to: /admin/plans
4. Verify: NO "Create Plan" button
5. Verify: NO Edit/Delete actions
6. Verify: Can view and compare plans
```

### Test 3: Role-Based Routing
```bash
# As Super Admin
- Can access: /super-admin/*
- Can access: /admin/* (if needed)

# As Admin
- Can access: /admin/*
- Cannot access: /super-admin/*

# As Agent
- Can access: /agent/*
- Cannot access: /admin/* or /super-admin/*
```

---

## 🔧 Troubleshooting

### Can't Login?
1. Check if backend is running: http://localhost:3000
2. Check if frontend is running: http://localhost:5173
3. Clear browser cache and cookies
4. Try incognito/private mode

### Wrong Role Access?
1. Check browser console for user object
2. Verify role in database:
```sql
SELECT email, role FROM users;
```
3. Log out and log back in

### 404 on Routes?
1. Verify you're logged in
2. Check your role matches the route
3. Super admin routes: `/super-admin/*`
4. Admin routes: `/admin/*`
5. Agent routes: `/agent/*`

### Database Issues?
```bash
# Reset database
dropdb whatscrm
createdb whatscrm

# Restart backend (will create tables)
# Then reseed
cd backend
npm run seed:super-admin
```

---

## 📊 Role Access Matrix

| Feature | Super Admin | Admin | Agent | User |
|---------|------------|-------|-------|------|
| View Subscription Plans | ✅ | ✅ | ❌ | ❌ |
| Create Subscription Plans | ✅ | ❌ | ❌ | ❌ |
| Edit Subscription Plans | ✅ | ❌ | ❌ | ❌ |
| Delete Subscription Plans | ✅ | ❌ | ❌ | ❌ |
| Manage All Tenants | ✅ | ❌ | ❌ | ❌ |
| Manage Own Tenant | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Handle Conversations | ✅ | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ |

---

## 🚀 Next Steps

1. ✅ Login with super admin credentials
2. ✅ Create a test subscription plan
3. ✅ Register as a new admin (tenant owner)
4. ✅ Verify admin can only view plans
5. ✅ Create an agent user
6. ✅ Test role-based access

---

## 📝 Important Notes

- **Super Admin Password:** Change `SuperAdmin123!` in production
- **First Registration:** First user of a tenant becomes admin automatically
- **Role Hierarchy:** super_admin → admin → agent → user
- **Admin = Tenant Owner:** There is no separate "tenant" role
- **Security:** All passwords should be changed in production

---

## 🎉 You're All Set!

Both servers are running and the super admin is seeded. You can now test the complete role-based access control system!

**Start Here:** http://localhost:5173/auth/login
