# Super Admin Setup Guide

## Quick Start

### 1. Create Super Admin User

```bash
npm run seed:super-admin
```

### 2. Login Credentials

**Default:**
- Email: `superadmin@whatscrm.com`
- Password: `SuperAdmin123!`

**Custom (via .env):**
```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=YourSecurePassword!
```

### 3. Access Super Admin Dashboard

1. Login at `/auth/login`
2. Navigate to `/super-admin/dashboard`

## API Endpoints

All endpoints require `super_admin` role in JWT token.

### Get Platform Stats
```
GET /super-admin/dashboard/stats
```

### Manage Tenants
```
GET /super-admin/tenants
GET /super-admin/tenants/:id
PUT /super-admin/tenants/:id/status
```

### Manage Users
```
GET /super-admin/users
```

### Analytics
```
GET /super-admin/analytics/overview
GET /super-admin/analytics/revenue
```

## Security Notes

⚠️ **IMPORTANT**: Change default credentials in production!

- Super admin has platform-wide access
- Can view/manage all tenants and users
- No tenant restrictions
- Use strong passwords
- Limit super admin accounts

## Troubleshooting

**Seed already exists:**
```
✓ Super admin already exists
```
This is normal - super admin can only be created once.

**To reset:**
Delete the super admin user from database and run seed again.

```sql
DELETE FROM users WHERE role = 'super_admin';
```

Then run: `npm run seed:super-admin`
