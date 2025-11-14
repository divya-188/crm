# 🔑 All Test Credentials

## 🌐 Application URLs
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

---

## 1️⃣ Super Admin (Platform Owner)
```
Email:    superadmin@whatscrm.com
Password: SuperAdmin123!
Role:     super_admin
```
**Access:** `/super-admin/*`  
**Can:** Create/Edit/Delete subscription plans, manage all tenants

---

## 2️⃣ Admin (Tenant Owner)
```
Email:    admin@test.com
Password: Admin123!
Role:     admin
```
**Access:** `/admin/*`  
**Can:** View subscription plans (read-only), manage own tenant, users, agents

---

## 3️⃣ Agent (Customer Service)
```
Email:    agent@test.com
Password: Agent123!
Role:     agent
```
**Access:** `/agent/*`  
**Can:** Handle conversations, manage contacts

---

## 4️⃣ User (End Customer)
```
Email:    user@test.com
Password: User123!
Role:     user
```
**Access:** `/`  
**Can:** Basic user features

---

## 🧪 Quick Test

### Test Subscription Plans Access:

**As Super Admin:**
1. Login: http://localhost:5173/auth/login
2. Go to: `/super-admin/plans`
3. ✅ See "Create Plan" button
4. ✅ See Edit/Delete actions

**As Admin:**
1. Login: http://localhost:5173/auth/login
2. Go to: `/admin/plans`
3. ❌ NO "Create Plan" button
4. ✅ Can view and compare plans

---

## 📊 Access Matrix

| Feature | Super Admin | Admin | Agent | User |
|---------|:-----------:|:-----:|:-----:|:----:|
| Create Plans | ✅ | ❌ | ❌ | ❌ |
| View Plans | ✅ | ✅ | ❌ | ❌ |
| Manage Tenants | ✅ | Own Only | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Handle Chats | ✅ | ✅ | ✅ | ❌ |
