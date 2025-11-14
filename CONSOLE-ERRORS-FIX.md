# Console Errors - Troubleshooting Guide

## Common Issues & Fixes

### 1. TypeScript "Cannot find module" Error

**Error:** `Cannot find module './super-admin.service'`

**Cause:** TypeScript server cache issue

**Fix:**
```bash
# In VS Code or your IDE:
1. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

# Or restart your IDE completely
```

### 2. Backend Not Starting

**Check these:**
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Check for TypeScript errors
npm run build

# 3. Start the server
npm run start:dev
```

### 3. Frontend Errors

**Common fixes:**
```bash
cd frontend

# 1. Clear node_modules and reinstall
rm -rf node_modules
npm install

# 2. Clear build cache
rm -rf .next  # if using Next.js
rm -rf dist   # if using Vite

# 3. Restart dev server
npm run dev
```

### 4. Module Resolution Errors

**If you see "Module not found" errors:**

1. Check file exists:
```bash
ls -la backend/src/modules/super-admin/
```

2. Verify exports:
```typescript
// In super-admin.service.ts
export class SuperAdminService { ... }  // ✅ Correct

class SuperAdminService { ... }  // ❌ Missing export
```

3. Check imports:
```typescript
// Correct
import { SuperAdminService } from './super-admin.service';

// Wrong
import SuperAdminService from './super-admin.service';  // ❌ No default export
```

### 5. Database Connection Errors

**Error:** `Connection refused` or `ECONNREFUSED`

**Fix:**
```bash
# 1. Check PostgreSQL is running
# Mac:
brew services list
brew services start postgresql

# Linux:
sudo systemctl status postgresql
sudo systemctl start postgresql

# 2. Check .env file
cat backend/.env

# Should have:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=whatscrm
```

### 6. Port Already in Use

**Error:** `Port 3000 is already in use`

**Fix:**
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### 7. CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Fix:**
Check `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:5173',  // Your frontend URL
  credentials: true,
});
```

### 8. JWT/Auth Errors

**Error:** `Unauthorized` or `Invalid token`

**Fix:**
1. Check JWT_SECRET in `.env`
2. Clear localStorage in browser
3. Login again

```javascript
// In browser console:
localStorage.clear();
// Then refresh and login again
```

### 9. Super Admin Route Not Found

**Error:** `404 Not Found` on `/super-admin/*`

**Fix:**
1. Ensure backend is running
2. Check route registration:
```bash
# Should see SuperAdminModule in output
grep -r "SuperAdminModule" backend/src/app.module.ts
```

3. Restart backend:
```bash
cd backend
npm run start:dev
```

### 10. Frontend Route Not Working

**Error:** Blank page or 404 on `/super-admin/dashboard`

**Fix:**
1. Check browser console for errors
2. Verify route is registered in `frontend/src/routes/index.tsx`
3. Check role-based route protection:
```typescript
// Should allow 'super_admin'
<RoleBasedRoute allowedRoles={['super_admin']}>
```

## Quick Diagnostic Commands

### Backend Health Check
```bash
cd backend

# Check if server is running
curl http://localhost:3000/health

# Check super admin endpoints
curl http://localhost:3000/super-admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Health Check
```bash
cd frontend

# Check if dev server is running
curl http://localhost:5173

# Check for build errors
npm run build
```

### Database Health Check
```bash
# Connect to database
psql -U postgres -d whatscrm

# Check if super admin exists
SELECT * FROM users WHERE role = 'super_admin';

# Exit
\q
```

## Still Having Issues?

### 1. Check All Services Are Running
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Database
# Should already be running
```

### 2. Check Logs
```bash
# Backend logs
cd backend
npm run start:dev
# Watch for errors in output

# Frontend logs
cd frontend
npm run dev
# Watch for errors in output
```

### 3. Verify Installation
```bash
# Backend
cd backend
npm list @nestjs/common @nestjs/core

# Frontend
cd frontend
npm list react react-dom
```

### 4. Clean Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables Checklist

### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=whatscrm

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Super Admin (Optional)
SUPER_ADMIN_EMAIL=superadmin@whatscrm.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!

# Server
PORT=3000
NODE_ENV=development
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
```

## Common Console Errors & Solutions

### "Cannot read property of undefined"
- Check if data is loaded before rendering
- Add loading states
- Use optional chaining: `data?.property`

### "React Hook useEffect has missing dependencies"
- Add dependencies to useEffect array
- Or use eslint-disable if intentional

### "Failed to fetch"
- Backend not running
- Wrong API URL
- CORS not configured

### "401 Unauthorized"
- Not logged in
- Token expired
- Wrong credentials

### "403 Forbidden"
- Wrong role (not super_admin)
- Missing permissions
- Check RolesGuard

## Need More Help?

1. **Check the logs** - Most errors show in console
2. **Restart everything** - Often fixes cache issues
3. **Clear browser cache** - Fixes frontend issues
4. **Rebuild** - `npm run build` to check for errors
5. **Check documentation** - See SUPER-ADMIN-IMPLEMENTATION-COMPLETE.md

---

**Pro Tip:** Keep 3 terminals open:
1. Backend (`npm run start:dev`)
2. Frontend (`npm run dev`)
3. Commands (for testing, seeds, etc.)

This way you can see errors in real-time!
